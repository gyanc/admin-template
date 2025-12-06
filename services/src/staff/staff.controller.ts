import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('staff:create')
  @ApiOperation({ summary: 'Create new staff member' })
  @ApiResponse({ status: 201, description: 'Staff created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  create(@Body() createStaffDto: any) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('staff:read')
  findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.staffService.findAll(Number(skip), Number(take), status, department);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('staff:read')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('staff:update')
  update(@Param('id') id: string, @Body() updateStaffDto: any) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('staff:delete')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Post(':id/assign-roles')
  @UseGuards(PermissionsGuard)
  @Permissions('staff:manage')
  assignRoles(@Param('id') id: string, @Body('roleIds') roleIds: string[]) {
    return this.staffService.assignRoles(id, roleIds);
  }

  @Post(':id/reset-password')
  @UseGuards(PermissionsGuard)
  @Permissions('staff:update')
  resetPassword(@Param('id') id: string) {
    return this.staffService.resetPassword(id);
  }
}
