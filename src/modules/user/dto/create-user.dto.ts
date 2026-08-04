import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z]+$/, { message: 'name must contain only letters' })
  name!: string;
}