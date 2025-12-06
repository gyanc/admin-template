import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings or by category' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns list of settings' })
  async getAll(@Query('category') category?: string) {
    if (category) {
      return this.settingsService.getByCategory(category);
    }
    return this.settingsService.getAll();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('settings:create')
  async createSetting(@Body() body: any, @CurrentUser() user: any) {
    return this.settingsService.createSetting(
      body.key,
      body.value,
      body.category,
      user.id,
    );
  }

  @Put(':key')
  @UseGuards(PermissionsGuard)
  @Permissions('settings:update')
  async setSetting(@Param('key') key: string, @Body() body: any, @CurrentUser() user: any) {
    return this.settingsService.setSetting(key, body.value, body.category, user.id);
  }

  @Post('bulk/update')
  @UseGuards(PermissionsGuard)
  @Permissions('settings:update')
  async updateMultiple(@Body() body: { settings: Array<{ key: string; value: any }> }, @CurrentUser() user: any) {
    return this.settingsService.updateMultiple(body.settings, user.id);
  }

  @Delete(':key')
  @UseGuards(PermissionsGuard)
  @Permissions('settings:delete')
  async deleteSetting(@Param('key') key: string) {
    return this.settingsService.deleteSetting(key);
  }
}
