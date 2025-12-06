import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(createUserDto.password);

    // Build name from firstName/lastName or use name
    const fullName = createUserDto.firstName && createUserDto.lastName
      ? `${createUserDto.firstName} ${createUserDto.lastName}`
      : createUserDto.name || '';

    // Determine status from isActive or default to ACTIVE
    const status = createUserDto.isActive === false ? 'INACTIVE' : 'ACTIVE';

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: fullName,
        phone: createUserDto.phone,
        status: status as any,
      },
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

    // Remove password from response
    const { password, ...result } = user;
    return result;
  }

  async findAll(skip = 0, take = 20, status?: string, search?: string) {
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status as any;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);
    const currentPage = Math.floor(skip / take) + 1;

    return {
      data: users,
      meta: {
        total,
        page: currentPage,
        limit: take,
        totalPages,
      },
      pagination: {
        total,
        skip,
        take,
        pages: totalPages,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build update data
    const updateData: any = {};
    
    if (updateUserDto.firstName !== undefined || updateUserDto.lastName !== undefined) {
      const firstName = updateUserDto.firstName ?? user.name.split(' ')[0];
      const lastName = updateUserDto.lastName ?? user.name.split(' ').slice(1).join(' ');
      updateData.name = `${firstName} ${lastName}`.trim();
    } else if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name;
    }
    
    if (updateUserDto.phone !== undefined) {
      updateData.phone = updateUserDto.phone;
    }
    
    // Handle status - map isActive to status or use status directly
    if (updateUserDto.isActive !== undefined) {
      updateData.status = updateUserDto.isActive ? 'ACTIVE' : 'INACTIVE';
    } else if (updateUserDto.status !== undefined) {
      updateData.status = updateUserDto.status;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    return { message: 'User deleted successfully' };
  }

  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove existing roles
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Add new roles
    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
    });

    return this.findOne(userId);
  }

  async resetPassword(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15).toUpperCase();
    const hashedPassword = await this.authService.hashPassword(tempPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'password_reset',
        resource: 'users',
        resourceId: userId,
      },
    });

    return {
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
    };
  }
}
