import { PlATFORM } from '../../main/entities/enums/platform.enum';

export class TransferCoreDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fromAccountNarration: string;
  toAccountNarration: string;
  reference: string;
  channel?: PlATFORM;
}

