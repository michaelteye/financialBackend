import { EntityManager, Not, Repository } from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { STATUS } from '../../../../src/modules/auth/entities/enums/status.enum';
import { AppRequestContext } from '../../../../src/utils/app-request.context';
import { getAppContextALS } from '../../../../src/utils/context';
import { GOAL_STATUS } from '../../../../src/modules/auth/entities/enums/goal-status.enum';
import { Inject, HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { generateCode } from '../../../utils/shared';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { UserEntity } from '../../main/entities/user.entity';
import { SurveyEntity } from '../entity/survey.entity';
import { SurveyDto, SurveyEditDto } from '../dtos/survey.dto';
import { Like } from 'typeorm';


export class SurveyService{
  
    constructor(
        @InjectRepository(SurveyEntity)
        private referralRepository: Repository<SurveyEntity>,
        private em: EntityManager,
    ) {}

    async createSurvey(request: SurveyEditDto):Promise<SurveyDto>{
        const ctx = getAppContextALS<AppRequestContext>();
        const survey = new SurveyEntity()
        survey.message = request.message;
        survey.rating =  request.rating;
        survey.userId = ctx.authUser.userId;
        survey.additional_info = request.additional_info;
        
        return  this.em.save(survey) as unknown as SurveyDto;
    


    }


}