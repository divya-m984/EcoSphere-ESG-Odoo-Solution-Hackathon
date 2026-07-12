import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AttendanceStatus, TransportMode } from '@prisma/client';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsEnum(TransportMode)
  transportModeOverride?: TransportMode;
}
