import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common'; 
@Injectable()
export class UserService {
  private users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ];

  findAll() {
    return this.users;
  }

  // store users in memory, replace iwt postgres
  create(user: { name: string }) {
  const newUser = {
    id: this.users.length + 1,
    name: user.name,
  };

  this.users.push(newUser);
  return newUser;
  }

  findOne(id: number) {
  const user = this.users.find(user => user.id === id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
  }

  remove(id: number) {
  const index = this.users.findIndex(user => user.id === id);

  if (index === -1) {
    throw new NotFoundException('User not found');
  }

  const deletedUser = this.users[index];
  this.users.splice(index, 1);

  return deletedUser;
  }


  update(id: number, updateUserDto: { name: string }) {
  const user = this.users.find(user => user.id === id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  user.name = updateUserDto.name;

  return user;
  }
}


