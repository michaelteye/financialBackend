import { AccountTypeEntity } from '../entities/account-type.entity';
import { AccountTypeDto, AccountTypeInputDto } from '../dtos/account-type.dto';
import { EntityManager, Not, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ACCOUNT_TYPE_CATEGORY } from '../../main/entities/enums/accounttypecategory.enum';
import { MigrateAllUserDataCommand } from '../../migration/commands/migrate-userdata-all';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { HttpException } from '@nestjs/common';

export class AccountTypeService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,

    @InjectRepository(AccountTypeEntity)
    private accountTypeRepository: Repository<AccountTypeEntity>,
  ) {}

  async create(input: AccountTypeInputDto): Promise<AccountTypeDto> {
    const accountType = this.em.create(AccountTypeEntity, input);
    return this.em.save(accountType) as unknown as AccountTypeDto;
  }

  async all(): Promise<Partial<AccountTypeDto>[]> {
    const accountTypes = await this.accountTypeRepository.find({
      where: { accountTypeCategory: ACCOUNT_TYPE_CATEGORY.core_product },
    });

    return accountTypes;
  }

  async getFlexiSaveAccounType() {
    const accountType = await this.em.findOne(AccountTypeEntity, {
      where: { alias: 'flexi-save' },
    });
    return accountType;
  }

  async get(id: string): Promise<AccountTypeDto | AccountTypeEntity> {
    return (await this.em.findOne(AccountTypeEntity, {
      where: { id: id },
    })) as AccountTypeDto | AccountTypeEntity;
  }

  async migrateUser(phone: string): Promise<any> {
    const createUser = new MigrateAllUserDataCommand(this.em, this.connection);
    return await createUser.globalUserMigration(phone);
  }

  async swapDevAndClientAuthCredentials(
    devphone: string,
    userphone: string,
  ): Promise<void> {
    const devRes = await this.em.findOne(AuthUserEntity, {
      where: { phone: devphone },
    });
    const userRes = await this.em.findOne(AuthUserEntity, {
      where: { phone: userphone },
    });

    if (devRes && userRes) {
      const query = `
    UPDATE public.auth_user_entity
SET
    phone = CASE
        WHEN phone = '${devphone}' THEN (
            SELECT phone FROM public.auth_user_entity WHERE phone = '${userphone}'
        )
        ELSE (
            SELECT phone FROM public.auth_user_entity WHERE phone = '${devphone}'
        )
    END,
    password = CASE
        WHEN phone = '233559876496' THEN (
            SELECT password FROM public.auth_user_entity WHERE phone = '${userphone}'
        )
        ELSE (
            SELECT password FROM public.auth_user_entity WHERE phone = '${devphone}'
        )
    END WHERE phone IN ('${devphone}', '${userphone}')
    `;
      return await this.em.query(query);
    } else {
      throw new HttpException(
        'account associated with devphone or phone must be present',
        400,
      );
    }
  }

  async getAccountTypeById(id: string): Promise<AccountTypeEntity> {
    return await this.em.findOne(AccountTypeEntity, {
      where: { id: id },
    });
  }

  // async getGroupAccountTypeById(id: string): Promise<AccountTypeEntity> {
  //   return await this.em.findOne(AccountTypeEntity, {
  //     where: { id: id },
  //   });
  // }



  async update(
    id: string,
    input: AccountTypeInputDto,
  ): Promise<AccountTypeDto> {
    const accountType: AccountTypeEntity | AccountTypeDto = await this.get(id);
    if (!accountType) {
      throw new Error('AccountType not found');
    }
    accountType.name = input.name;
    accountType.withdrawalPeriod = input.withdrawalPeriod;
    accountType.dailyLimit = input.dailyLimit;
    accountType.monthlyLimit = input.monthlyLimit;
    accountType.withdrawalStartingCost = input.withdrawalStartingCost;
    accountType.withdrawalEndingCost = input.withdrawalEndingCost;
    return this.em.save(accountType) as unknown as AccountTypeDto;
  }
}
