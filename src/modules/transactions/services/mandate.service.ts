import { Injectable, HttpException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { MandateEntity } from '../entities/mandate.entity';
import { MandateStatus } from '../../enums/mandate.status.enum';
import {
  CreateMandateDto,
  UserMandateListItemDto,
} from '../dtos/createmandate.dto';
import axios from 'axios';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';
import { uuid } from 'uuidv4';
import { MandateCategory } from '../../enums/mandate.category.enum';

@Injectable()
export class MandateService extends HttpRequestService {
  constructor(
    @InjectRepository(MandateEntity)
    private readonly mandateRepository: Repository<MandateEntity>,
  ) {
    super();
  }

  async findAll(): Promise<UserMandateListItemDto[]> {
    const ctx = getAppContextALS<AppRequestContext>();
    let userId = ctx.authUser.userId;
    let sql = `SELECT m."phoneNumber",s."name" as "savingsGoalName",
    a."name" as "accountName",
    m."accountId",m."mandateId",m.amount,m.frequency,m."startDate",m."endDate"
    from mandate_entity m 
    INNER JOIN account_entity a 
    on a.id=m."accountId"
    INNER JOIN savings_goal_entity s
    on s."accountId"=m."accountId"
    where m."userId"='${userId}'`;
    return this.mandateRepository.query(sql);
  }

  async create(createMandateDto: CreateMandateDto): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();
    const reference = uuid();
    const mandate = new MandateEntity();
    mandate.phoneNumber = createMandateDto.phoneNumber;
    mandate.amount = createMandateDto.amount;
    mandate.frequency = createMandateDto.frequency;
    mandate.accountId = createMandateDto.accountId;
    mandate.userId = ctx.authUser.userId;
    mandate.reference = reference;
    mandate.startDate = createMandateDto.startDate as Date;
    mandate.endDate = createMandateDto.endDate as Date;
    mandate.status = MandateStatus.PENDING;
    mandate.category = createMandateDto.category;
    // mandate.debitDay = createMandateDto.debitDay;
    mandate.mandateId = reference;
    const postdata = {
      phoneNumber: mandate.phoneNumber,
      amount: mandate.amount,
      callbackUrl: this.cfg.payment.mandateCallback,
      autoDeductCallbackUrl: this.cfg.payment.autoDeductCallback,
      reference: mandate.reference,
      frequencyType: createMandateDto.frequency,
      startDate: createMandateDto.startDate,
      endDate: createMandateDto.endDate,
    };

    console.log('postdata', postdata);
    const url = `${this.cfg.payment.url}/auto/createmandate`;
    const config = {
      headers: {
        'x-api-key': this.cfg.payment.apiKey,
        'Content-Type': 'application/json',
      },
    };
    const retResponse = {
      status: '',
      message: '',
      mandateId: postdata.reference,
    };

    if (createMandateDto.category == MandateCategory.BEZOPRIMARY) {
      mandate.status = MandateStatus.ACTIVE;
      await this.mandateRepository.save(mandate);

      retResponse.message = 'Mandate created successfully';
      retResponse.status = 'SUCCESS';
      return retResponse;
    } else {
      try {
        
        mandate.category = MandateCategory.BEZOPRIMARY;
        mandate.status = MandateStatus.ACTIVE;
        await this.mandateRepository.save(mandate);

        retResponse.message = 'Mandate created successfully';
        retResponse.status = 'SUCCESS';
        return retResponse;

      //   const response = await axios.post(
      //     url,
      //     postdata,
      //     config
      //   );
      //   console.log('Response form create mandate>>', response);
      //   console.log("mandate to save>>>>>",mandate)
      //   this.logger.log(response.data, 'Response from create mandate >>>')
      //   console.log('Response form create mandate>>', response.data);
      //   if (response.data.status === 'PENDING') {
      //     mandate.status = MandateStatus.PENDING;
      //     retResponse.message = "Mandate created successfully"
      //     retResponse.status = "SUCCESS";
      //   } else if (response.data.status === 'FAILED') {
      //     retResponse.status = "FAILED";
      //     retResponse.message = "Mandate creation failed."
      //     mandate.status = MandateStatus.FAILED;
      //   }
      //   console.log("mandate to save 2 >>>>>",mandate)
      //   await this.mandateRepository.save(mandate);
      //   return retResponse;
      } catch (error) {
        console.log('Error posting mandate>>>>', JSON.stringify(error));
        retResponse.message = 'Mandate creation failed.' + error.message;
        retResponse.status = 'FAILED';
      }
      return retResponse;
    }
  }

  async deactivate(reference: string): Promise<any> {
    const mandate = await this.mandateRepository.findOne({
      where: { reference },
    });
    if (
      mandate.status == MandateStatus.DEACTIVATED ||
      mandate.status == MandateStatus.FAILED
    ) {
      return;
    }
    const retResponse = { status: 'FAILED', message: 'Mandate not found' };
    const config = {
      headers: {
        'x-api-key': this.cfg.payment.apiKey,
        'Content-Type': 'application/json',
      },
    };
    if (
      (mandate && mandate.category == MandateCategory.MOMO) ||
      (mandate && mandate.category == null)
    ) {
      retResponse.message = 'Mandate cancellation failed';
      const url = `${this.cfg.payment.url}/mandates/cancel/${mandate.mandateId}`;
      const response = await axios.post(url, config);
      if (response.data.status === 'SUCCESS') {
        retResponse.message = 'Mandate successfully cancelled';
        retResponse.status = 'SUCCESS';
        mandate.status = MandateStatus.DEACTIVATED;
      }
      await this.mandateRepository.save(mandate);
    } else if (mandate && mandate.category == MandateCategory.BEZOPRIMARY) {
      mandate.status = MandateStatus.DEACTIVATED;
      await this.mandateRepository.save(mandate);
    }
    return retResponse;
  }
}
