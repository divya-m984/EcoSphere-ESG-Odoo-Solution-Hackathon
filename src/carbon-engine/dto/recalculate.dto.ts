import { IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RecalculateDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds?: string[];

  @IsInt()
  @Min(1900)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
