import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(createStaffDto: any) {
    const { email, name, firstName, lastName, phone, department, isActive } = createStaffDto;

    // Check if staff already exists
    const existingStaff = await this.prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      throw new BadRequestException('Staff with this email already exists');
    }

    // Build name from firstName/lastName or use name
    const fullName = firstName && lastName
      ? `${firstName} ${lastName}`
      : name || '';

    // Determine status from isActive or default to ACTIVE
    const status = isActive === false ? 'INACTIVE' : 'ACTIVE';

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15).toUpperCase();
    const hashedPassword = await this.authService.hashPassword(tempPassword);

    const staff = await this.prisma.staff.create({
      data: {
        email,
        password: hashedPassword,
        name: fullName,
        phone,
        department,
        status: status as any,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      ...staff,
      password: undefined,
      temporaryPassword: tempPassword,
    };
  }

  async findAll(skip = 0, take = 20, status?: string, department?: string, search?: string) {
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status as any;
    }
    
    if (department && department !== 'all') {
      where.department = department;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          department: true,
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
      this.prisma.staff.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);
    const currentPage = Math.floor(skip / take) + 1;

    return {
      data: staff,
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
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        department: true,
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

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async update(id: string, updateStaffDto: any) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Build update data
    const updateData: any = {};
    
    if (updateStaffDto.firstName !== undefined || updateStaffDto.lastName !== undefined) {
      const firstName = updateStaffDto.firstName ?? staff.name.split(' ')[0];
      const lastName = updateStaffDto.lastName ?? staff.name.split(' ').slice(1).join(' ');
      updateData.name = `${firstName} ${lastName}`.trim();
    } else if (updateStaffDto.name !== undefined) {
      updateData.name = updateStaffDto.name;
    }
    
    if (updateStaffDto.phone !== undefined) {
      updateData.phone = updateStaffDto.phone;
    }
    
    if (updateStaffDto.department !== undefined) {
      updateData.department = updateStaffDto.department;
    }
    
    // Handle status - map isActive to status or use status directly
    if (updateStaffDto.isActive !== undefined) {
      updateData.status = updateStaffDto.isActive ? 'ACTIVE' : 'INACTIVE';
    } else if (updateStaffDto.status !== undefined) {
      updateData.status = updateStaffDto.status;
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        department: true,
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
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Soft delete
    await this.prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });

    return { message: 'Staff deleted successfully' };
  }

  async assignRoles(staffId: string, roleIds: string[]) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Remove existing roles
    await this.prisma.staffRole.deleteMany({
      where: { staffId },
    });

    // Add new roles
    await this.prisma.staffRole.createMany({
      data: roleIds.map((roleId) => ({
        staffId,
        roleId,
      })),
    });

    return this.findOne(staffId);
  }

  async resetPassword(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15).toUpperCase();
    const hashedPassword = await this.authService.hashPassword(tempPassword);

    await this.prisma.staff.update({
      where: { id: staffId },
      data: { password: hashedPassword },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        staffId,
        action: 'password_reset',
        resource: 'staff',
        resourceId: staffId,
      },
    });

    return {
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
    };
  }
}
