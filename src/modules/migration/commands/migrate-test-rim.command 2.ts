import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { UserEntity } from '../../main/entities/user.entity';
import { EntityManager } from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { RimEntity } from '../../account/entities/rim.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { TransferCoreService } from '../../transfers/services/transfer.core.service';

@Console()
export class TestRimBalancesCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
     @InjectConnection() private connection: Connection,
     private transfer:TransferCoreService
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:testrimbalance'
  })
 
  async execute(opts?: any) {
    console.log('Running rim balances >>>>>')
    try {
      return await this.migrateRimBalances();
    } catch (e) {
      console.error(e);
      return 1;
    }
  }
 

 

  async migrateRimBalances() {
    // const toAccount='dc7b4f35-b330-4687-b67f-c65a354a377f'
    // const fromAccount='78a29301-67ee-4e60-b771-ab0348bcce99'

   // const res=await this.transfer.updateBalance(fromAccount,toAccount)


   function sharePeople(people) {
    let present = [];
    let absent = [];
    
    // Split people into two arrays, present and absent
    for (let i = 0; i < people.length; i++) {
      if (i % 2 === 0) {
        present.push(people[i]);
      } else {
        absent.push(people[i]);
      }
    }
    
    // Create a 4-day schedule
    let schedule = [];
    for (let i = 0; i < 4; i++) {
      let day = {
        present: [present[i % 3], present[(i + 1) % 3], present[(i + 2) % 3]],
        absent: [absent[(i + 1) % 3], absent[(i + 2) % 3], absent[(i + 3) % 3]]
      };
      schedule.push(day);
    }
    
    return schedule;
  }
  
  let people = ["Person 1", "Person 2", "Person 3", "Person 4", "Person 5"];
  console.log(sharePeople(people));
  }



 



  
 
  
 
}
