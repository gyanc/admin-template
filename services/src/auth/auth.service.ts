import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, type: 'user' | 'staff' = 'user') {
    const { email, password } = loginDto;

    // Find user or staff
    let account;
    if (type === 'user') {
      account = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else {
      account = await this.prisma.staff.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await this.prisma.loginHistory.create({
        data: {
          email,
          status: 'FAILED',
          ipAddress: null,
          userAgent: null,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    if (type === 'user') {
      await this.prisma.user.update({
        where: { id: account.id },
        data: { lastLogin: new Date() },
      });
    } else {
      await this.prisma.staff.update({
        where: { id: account.id },
        data: { lastLogin: new Date() },
      });
    }

    // Log successful login
    await this.prisma.loginHistory.create({
      data: {
        email,
        status: 'SUCCESS',
        ipAddress: null,
        userAgent: null,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(account.id, account.email, type);

    // Flatten permissions
    const permissions = account.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
    );

    return {
      ...tokens,
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
        roles: account.roles.map((ur) => ur.role.name),
        permissions,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
      });

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.type);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto, type: 'user' | 'staff' = 'user') {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Get account
    let account;
    if (type === 'user') {
      account = await this.prisma.user.findUnique({ where: { id: userId } });
    } else {
      account = await this.prisma.staff.findUnique({ where: { id: userId } });
    }

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    if (type === 'user') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else {
      await this.prisma.staff.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: type === 'user' ? userId : null,
        staffId: type === 'staff' ? userId : null,
        action: 'password_change',
        resource: type,
        resourceId: userId,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12;
    return bcrypt.hash(password, saltRounds);
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Transform to match frontend expected structure
    const nameParts = user.name.split(' ');
    return {
      id: user.id,
      email: user.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      isActive: user.status === 'ACTIVE',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        isActive: true, // Roles don't have isActive field in schema, default to true
        createdAt: ur.role.createdAt.toISOString(),
        updatedAt: ur.role.updatedAt.toISOString(),
        permissions: ur.role.permissions.map((rp) => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description,
        })),
      })),
    };
  }

  async getStaffProfile(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!staff) {
      throw new UnauthorizedException('Staff not found');
    }

    // Transform to match frontend expected structure
    const nameParts = staff.name.split(' ');
    return {
      id: staff.id,
      email: staff.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: staff.phone,
      department: staff.department,
      isActive: staff.status === 'ACTIVE',
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
      roles: staff.roles.map((sr) => ({
        id: sr.role.id,
        name: sr.role.name,
        description: sr.role.description,
        isActive: true, // Roles don't have isActive field in schema, default to true
        createdAt: sr.role.createdAt.toISOString(),
        updatedAt: sr.role.updatedAt.toISOString(),
        permissions: sr.role.permissions.map((rp) => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description,
        })),
      })),
    };
  }

  private async generateTokens(userId: string, email: string, type: 'user' | 'staff') {
    const payload = { sub: userId, email, type };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
        expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
