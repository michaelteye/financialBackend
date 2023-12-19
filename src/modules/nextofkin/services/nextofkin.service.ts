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
import { UserNextOfKinEntity } from '../../nextofkin/entities/user_next_of_kin.entity';
import { UserNextOfKinDto, UserNextOfKinInputEditDto } from '../../nextofkin/dtos/user_next_of_kin.dto';


export class NextOfKinService {
    constructor(
        @InjectRepository(UserNextOfKinEntity)
        private usernextofkinRepository: Repository<UserNextOfKinEntity>,
        private em: EntityManager,
    ){}
    async createNextOfKing(request: UserNextOfKinInputEditDto): Promise<UserNextOfKinDto>{
        const ctx = getAppContextALS<AppRequestContext>();
        // console.log('Create next of kin payload>>', request);
        const nextofkin = new UserNextOfKinEntity()
        nextofkin.firstName = request.firstName;
        nextofkin.lastName = request.lastName;
        nextofkin.country = request.country;
        nextofkin.gender = request.gender;
        nextofkin.relationship = request.relationship;
        nextofkin.homeAddress = request.homeAddress;
        nextofkin.userId = ctx.authUser.userId;
        nextofkin.gpsAddress = request.gpsAddress;
        nextofkin.dateOfBirth = typeof request.dateOfBirth === "string" ? new Date(request.dateOfBirth) :request.dateOfBirth;
        nextofkin.occupation = request.occupation;
        nextofkin.phone = request.phone;
        // const nextofkins= this.em.create(UserNextOfKingEntity, request);
        console.log('the nestofkin is >>>',nextofkin)
        return  this.em.save(nextofkin) as unknown as UserNextOfKinDto
    };
    async getUserNextOfKing(id: string): Promise<UserNextOfKinEntity>{
        let UserProfile = await this.em.findOne(UserNextOfKinEntity, {
          where :{ userId: id}
        })
        if(!UserProfile){
          throw new HttpException(`User profile with ${id} not found`, 400);
        }
        return UserProfile;
      
    }
    async UpdateNextOfKin(id: string, input: UserNextOfKinInputEditDto):Promise<any>{
        const updateNextOfkin = await this.em.findOne(UserNextOfKinEntity,{
          where:{userId:id}
        })
        console.log('the updateNextOfking is >>> ', updateNextOfkin)
        if(!updateNextOfkin){
          throw new HttpException("couldn't update the next of king",404);
        }
    
        updateNextOfkin.firstName = input.firstName;
        updateNextOfkin.region = input.region;
        updateNextOfkin.relationship = input.relationship;
        updateNextOfkin.lastName = input.lastName;
        updateNextOfkin.country = input.country;
        updateNextOfkin.gender = input.gender;
        updateNextOfkin.homeAddress = input.homeAddress;
        updateNextOfkin.gpsAddress = input.gpsAddress;
        updateNextOfkin.dateOfBirth = typeof input.dateOfBirth === "string" ? new Date(input.dateOfBirth) :input.dateOfBirth;
        updateNextOfkin.occupation = input.occupation;
        updateNextOfkin.phone = input.phone;
        console.log('updateNextOfKin >>>',updateNextOfkin)
        return this.em.save(updateNextOfkin) as unknown as UserNextOfKinDto;
    
      }
}