import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Email Templates')
@ApiBearerAuth('JWT-auth')
@Controller('email-templates')
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(private emailTemplatesService: EmailTemplatesService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('email-templates:create')
  @ApiOperation({ summary: 'Create new email template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  async create(@Body() createEmailTemplateDto: any, @CurrentUser() user: any) {
    return this.emailTemplatesService.create(createEmailTemplateDto, user.id);
  }

  @Get()
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('triggerType') triggerType?: string,
    @Query('search') search?: string,
  ) {
    return this.emailTemplatesService.findAll(parseInt(skip), parseInt(take), triggerType, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailTemplatesService.findOne(id);
  }

  @Get(':id/versions')
  async getVersions(
    @Param('id') id: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.emailTemplatesService.getVersions(id, parseInt(skip), parseInt(take));
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('email-templates:update')
  async update(@Param('id') id: string, @Body() updateEmailTemplateDto: any, @CurrentUser() user: any) {
    return this.emailTemplatesService.update(id, updateEmailTemplateDto, user.id);
  }

  @Post(':id/restore/:version')
  @UseGuards(PermissionsGuard)
  @Permissions('email-templates:update')
  async restoreVersion(@Param('id') id: string, @Param('version') version: string, @CurrentUser() user: any) {
    return this.emailTemplatesService.restoreVersion(id, parseInt(version), user.id);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('email-templates:delete')
  async remove(@Param('id') id: string) {
    return this.emailTemplatesService.remove(id);
  }
}
