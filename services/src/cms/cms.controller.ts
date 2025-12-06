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
  findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
    @Query('status') status?: string,
  ) {
    return this.cmsService.findAll(Number(skip), Number(take), status);
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
