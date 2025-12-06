import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Missing permission' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
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
    
    return this.usersService.findAll(finalSkip, finalTake, status, search);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('users:delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/assign-roles')
  @UseGuards(PermissionsGuard)
  @Permissions('users:update')
  assignRoles(@Param('id') id: string, @Body('roleIds') roleIds: string[]) {
    return this.usersService.assignRoles(id, roleIds);
  }

  @Post(':id/reset-password')
  @UseGuards(PermissionsGuard)
  @Permissions('users:update')
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }
}
