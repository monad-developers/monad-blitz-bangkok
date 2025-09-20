import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class InitPolyCrerateDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  limit: number;

  @IsNotEmpty()
  @IsNumber()
  offset: number;
}
