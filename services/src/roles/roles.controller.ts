import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('roles:create')
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  create(@Body() createRoleDto: any) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('roles:read')
  findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.rolesService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('roles:read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('roles:update')
  update(@Param('id') id: string, @Body() updateRoleDto: any) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('roles:delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/assign-permissions')
  @UseGuards(PermissionsGuard)
  @Permissions('roles:manage')
  assignPermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    return this.rolesService.assignPermissions(id, permissionIds);
  }
}
