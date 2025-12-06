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
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('department') department?: string,
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
    
    return this.staffService.findAll(finalSkip, finalTake, status, department, search);
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
