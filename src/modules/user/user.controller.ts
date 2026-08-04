import { UserService } from './user.service';
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  return this.userService.findOne(Number(id));
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
  return this.userService.remove(Number(id));
  }


  @Put(':id')
  update(
  @Param('id') id: string,
  @Body() updateUserDto: UpdateUserDto,
  ) {
  return this.userService.update(Number(id), updateUserDto);
  }
}