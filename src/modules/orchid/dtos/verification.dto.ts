import { ApiProperty } from '@nestjs/swagger';

export class VerificationDto {
  @ApiProperty() customer_number: string;
  @ApiProperty() exttrid: string;
  @ApiProperty() service_id: string;
  @ApiProperty() nw: string;
  @ApiProperty() trans_type: string;
  @ApiProperty() ts: string;
}
