import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns list of permissions' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  async findAll(@Query('resource') resource?: string) {
    if (resource) {
      return this.permissionsService.findByResource(resource);
    }
    return this.permissionsService.findAll();
  }

  @Get('resources')
  @UseGuards(PermissionsGuard)
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get all unique resources' })
  @ApiResponse({ status: 200, description: 'Returns list of resources' })
  async getResources() {
    return this.permissionsService.getResources();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Returns permission details' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }
}

