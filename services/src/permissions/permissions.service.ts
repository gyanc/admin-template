import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    return permissions.map((permission) => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      name: `${permission.resource}:${permission.action}`,
      description: permission.description,
      roles: permission.roles.map((rp) => ({
        ...rp.role,
        isActive: true, // Roles don't have isActive in schema, default to true
      })),
      roleCount: permission.roles.length,
    }));
  }

  async findByResource(resource: string) {
    const permissions = await this.prisma.permission.findMany({
      where: { resource },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: { action: 'asc' },
    });

    return permissions.map((permission) => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      name: `${permission.resource}:${permission.action}`,
      description: permission.description,
      roles: permission.roles.map((rp) => ({
        ...rp.role,
        isActive: true, // Roles don't have isActive in schema, default to true
      })),
      roleCount: permission.roles.length,
    }));
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return null;
    }

    return {
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      name: `${permission.resource}:${permission.action}`,
      description: permission.description,
      roles: permission.roles.map((rp) => ({
        ...rp.role,
        isActive: true, // Roles don't have isActive in schema, default to true
      })),
      roleCount: permission.roles.length,
    };
  }

  async getResources() {
    const resources = await this.prisma.permission.findMany({
      select: {
        resource: true,
      },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });

    return resources.map((r) => r.resource);
  }
}

