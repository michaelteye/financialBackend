import {Controller,UseGuards,UsePipes,ValidationPipe,Post,Body,Get,Param,Patch, Put} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import {RoleAuthGuard,RoleAuth} from '../../../../src/modules/auth/guards/role-auth.guard';
import { AuthUserRole } from '../../../../src/modules/auth/types/auth-user.roles';
import { isUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { SurveyDto, SurveyEditDto } from '../dtos/survey.dto';
import { SurveyEntity } from '../entity/survey.entity';
import { SurveyService } from '../services/survey.service';
// import { SurveyDto } from '../dtos/survey.dto';

@Controller('users')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true}))

export class SurveyController {
    constructor(private service: SurveyService){ }
    @RoleAuth(AuthUserRole.User)
    @Post('survey')
    @ApiResponse({
    status: 201,
    description: 'your survey has been successfully created.',
    type: SurveyDto,
    })
    async sendTransferNotification(@Body() request: SurveyEditDto): Promise<SurveyDto> {
    return await this.service.createSurvey(request);
    }

}
