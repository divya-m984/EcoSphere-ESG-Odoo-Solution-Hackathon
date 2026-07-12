import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class BulkAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  employeeIds!: string[];

  @IsDateString()
  date!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}
