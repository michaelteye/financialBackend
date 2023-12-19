
import { Console, Command } from 'nestjs-console';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { UserEntity } from '../../main/entities/user.entity';
import { EntityManager } from 'typeorm';


@Console()
export class MigrateRoleToStaffCommand {

  constructor(
    private em: EntityManager,
  
  ) {
   
  }

  @Command({
    command: 'migrate:role-to-staff',
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  // write you 
  async _execute(opts?: any) {
    console.log('Migrating deposits ....');
    const roleChangeStaffs=await this.migrateStaff();

    console.log("roleChangeStaffs",roleChangeStaffs)
    console.log('Migration complete ....');
  }

 async selectStaffs():Promise<AuthUserEntity[]>{
    
  const query = `SELECT *
  FROM public.auth_user_entity
  WHERE "phone" = ANY (Array['233209141411', '233248990505', '233202675453', '233244219998', '233249338781', '233500025738', '233246583910', '233553503699', '233257102527', '233242403857', '233249735310', '233557241556', '233245216777', '233549791707', '233247029835', '233202215408', '233594951335', '233557696716', '233556578844', '233559876496', '233543681287', '233500392814',
   '233242656907', '233593322945', '233546711206',
    '233243377380', '233542101223'])`

// const query = `UPDATE public.auth_user_entity aue
// SET roles = '{BezoStaff}'
// FROM public.user_entity ue
// WHERE ue.id = aue."userId"
// AND aue.phone LIKE ANY (ARRAY['233209141411', '233248990505', '233202675453', '233244219998', '233249338781', '233500025738', '233246583910', '233553503699', '233257102527', '233242403857', '233249735310', '233557241556', '233245216777', '233549791707', '233247029835', '233202215408', '233594951335', '233557696716', '233556578844', '233559876496', '233543681287', '233500392814',
//    '233242656907', '233593322945', '233546711206',
//     '233243377380', '233542101223'])`

     return this.em.query(query)
 }

 async migrateStaff():Promise<any>{

  const allStaffs= await this.selectStaffs()

  console.log("allStaffs",allStaffs)

  return await Promise.all(
    allStaffs.map(async(r)=>{

      const foundData= await this.em.findOne(AuthUserEntity,{
        where: {id:r.id}
      })

      console.log("found",foundData)

    
      foundData.roles=[...r.roles,AuthUserRole.Staff]
      // const roleAdd=[...r.roles,AuthUserRole.Staff]
      // const dataToSave={
      //   ...r, roles:roleAdd
      // } as unknown as AuthUserEntity
       
  
       return await this.em.save(foundData)
    })
  )



 }


 
}

