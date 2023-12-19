import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountTypeEntity } from '../account/entities/account-type.entity';
import { AccountTypeService } from '../account/services/account-type.service';
import { UserService } from '../auth/services/user.service';
import { GroupController } from './controllers/group-controller';
import { GroupEntity } from './entities/group.entity';
import { GroupService } from './services/group-service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            GroupEntity,
            AccountTypeEntity
        ]),
    ],
    controllers: [GroupController],
    providers: [
        GroupService,AccountTypeService],
    exports: []
})
export class GroupModule {
}
