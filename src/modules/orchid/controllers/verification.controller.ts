import { Body, Controller, Inject, Post } from '@nestjs/common';
import { VerificationDto } from '../dtos/verification.dto';
import { VerificationService } from '../services/verification.service';
import { VerificationResponse } from '../dtos/verification.response';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('orchid')
@ApiTags('Orchid / Verify User By Phone Number')
export class verificationController {
  @Inject(VerificationService) verificationService: VerificationService;

  constructor() {}

  /**
   *
   * @param data
   * @returns The users name attched the the account.
   */
  @ApiBody({ type: VerificationDto })
  @Post('verify')
  async verify(@Body() data: VerificationDto): Promise<any> {
    const response = await this.verificationService.verifyUserByNumber(data);
    return response;
  }
}
