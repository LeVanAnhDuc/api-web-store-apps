import { Expose, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Max,
  Min
} from 'class-validator';

export class GetTodosQueryParamsDTO {
  @Expose()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  pageNo: number = 1;

  @Expose()
  @IsInt()
  @Max(120)
  @Transform(({ value }) => parseInt(value) || 10)
  pageSize: number = 10;

  @Expose()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (!value) return true;

    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }

    return Boolean(value);
  })
  isActive: boolean;

  @Expose()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  searchKey: string;

  @Expose()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  status: string;

  @Expose()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  projectName: string;
}

export class CreateTodoDTO {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  name: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  description: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  summary: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  projectName: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  status: string;
}

export class UpdateTodoDTO {
  @Expose()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  name: string;

  @Expose()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  description: string;
}
