import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: any) {
    const { name, description, permissionIds } = createRoleDto;

    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds?.map((permissionId: string) => ({
            permissionId,
          })) || [],
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return role;
  }

  async findAll(skip = 0, take = 20, search?: string) {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          users: true,
          staff: true,
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);
    const currentPage = Math.floor(skip / take) + 1;

    return {
      data: roles.map((role) => ({
        ...role,
        isActive: true, // Roles don't have isActive in schema, default to true
        userCount: role.users?.length || 0,
        staffCount: role.staff?.length || 0,
      })),
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
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: true,
        staff: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      ...role,
      isActive: true, // Roles don't have isActive in schema, default to true
      userCount: role.users?.length || 0,
      staffCount: role.staff?.length || 0,
    };
  }

  async update(id: string, updateRoleDto: any) {
    const { name, description, permissionIds } = updateRoleDto;

    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if name is already taken by another role
    if (name && name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name },
      });
      if (existingRole) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    // Update permissions if provided
    if (permissionIds) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
        staff: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to any user or staff
    if (role.users.length > 0 || role.staff.length > 0) {
      throw new BadRequestException(
        `Cannot delete role. It is assigned to ${role.users.length} users and ${role.staff.length} staff members.`,
      );
    }

    // Delete role permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete role
    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    return this.findOne(roleId);
  }
}
