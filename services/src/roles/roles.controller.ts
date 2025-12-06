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
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    // Support both skip/take and page/limit
    let finalSkip = 0;
    let finalTake = 20;
    
    if (page !== undefined && limit !== undefined) {
      finalSkip = (Number(page) - 1) * Number(limit);
      finalTake = Number(limit);
    } else if (skip !== undefined && take !== undefined) {
      finalSkip = Number(skip);
      finalTake = Number(take);
    }
    
    return this.rolesService.findAll(finalSkip, finalTake, search);
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
