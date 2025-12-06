import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('CMS')
@ApiBearerAuth('JWT-auth')
@Controller('cms')
@UseGuards(JwtAuthGuard)
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('cms:create')
  @ApiOperation({ summary: 'Create new CMS content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  create(@Body() createCmsDto: any, @CurrentUser() user: any) {
    return this.cmsService.create(createCmsDto, user.userId);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('cms:read')
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
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
    
    return this.cmsService.findAll(finalSkip, finalTake, status, search);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:read')
  findOne(@Param('id') id: string) {
    return this.cmsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:update')
  update(@Param('id') id: string, @Body() updateCmsDto: any, @CurrentUser() user: any) {
    return this.cmsService.update(id, updateCmsDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:delete')
  remove(@Param('id') id: string) {
    return this.cmsService.remove(id);
  }

  @Post(':id/publish')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:publish')
  publish(@Param('id') id: string, @Body('scheduledFor') scheduledFor: Date, @CurrentUser() user: any) {
    return this.cmsService.publish(id, user.userId, scheduledFor);
  }

  @Post(':id/unpublish')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:publish')
  unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cmsService.unpublish(id, user.userId);
  }

  @Get(':id/versions')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:read')
  getVersions(@Param('id') id: string) {
    return this.cmsService.getVersions(id);
  }

  @Post(':id/restore/:version')
  @UseGuards(PermissionsGuard)
  @Permissions('cms:update')
  restoreVersion(@Param('id') id: string, @Param('version') version: string, @CurrentUser() user: any) {
    return this.cmsService.restoreVersion(id, Number(version), user.userId);
  }
}
