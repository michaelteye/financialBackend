import { Logger, All, Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { VasService } from '../services/vas.service';
import { Repository } from 'typeorm';
@ApiTags('VAS')
@Controller('users/vas')

export class CallBackController {
  private readonly logger = new Logger('Callback Services');
  constructor(private service: VasService) {}

  @All('callback')
  @ApiResponse({
    status: 201,
  })
  async callBack(@Body() request: any): Promise<any> {
    this.logger.debug('callBack', JSON.stringify(request, null, 2));
    console.log("starting callbacking")
    return await this.service.vastransactionCallback(request);
  }

  
}
