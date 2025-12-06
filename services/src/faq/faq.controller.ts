import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('FAQ')
@ApiBearerAuth('JWT-auth')
@Controller('faq')
@UseGuards(JwtAuthGuard)
export class FaqController {
  constructor(private faqService: FaqService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('faq:create')
  @ApiOperation({ summary: 'Create new FAQ' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  async create(@Body() createFaqDto: any, @CurrentUser() user: any) {
    return this.faqService.create(createFaqDto, user.id);
  }

  @Get()
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    // Support both skip/take and page/limit
    let finalSkip = 0;
    let finalTake = 10;
    
    if (page !== undefined && limit !== undefined) {
      finalSkip = (parseInt(page) - 1) * parseInt(limit);
      finalTake = parseInt(limit);
    } else if (skip !== undefined && take !== undefined) {
      finalSkip = parseInt(skip);
      finalTake = parseInt(take);
    }
    
    return this.faqService.findAll(finalSkip, finalTake, category, search);
  }

  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.faqService.findByCategory(category, parseInt(skip), parseInt(take));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Post(':id/view')
  async recordView(@Param('id') id: string) {
    return this.faqService.recordView(id);
  }

  @Post(':id/helpful/:helpful')
  async recordHelpful(@Param('id') id: string, @Param('helpful') helpful: string) {
    return this.faqService.recordHelpful(id, helpful === 'true');
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('faq:update')
  async update(@Param('id') id: string, @Body() updateFaqDto: any, @CurrentUser() user: any) {
    return this.faqService.update(id, updateFaqDto, user.id);
  }

  @Post('update-priorities')
  @UseGuards(PermissionsGuard)
  @Permissions('faq:update')
  async updatePriorities(@Body() body: { faqIds: string[]; priorities: number[] }) {
    return this.faqService.updatePriority(body.faqIds, body.priorities);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('faq:delete')
  async remove(@Param('id') id: string) {
    return this.faqService.remove(id);
  }
}
