import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { JwtManagerService } from '../../auth/services/jwt-manager.service';
import { PasswordEncoderService } from '../../auth/services/password-encorder.service';

import { UserEntity } from '../../main/entities/user.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
// import dateFns from 'date-fns';
import { isBefore } from 'date-fns'
import { ErrorEntity } from '../entitites/error.entity';
import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { generateCode } from '../../../utils/shared';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { MigrationAccountEntity } from '../entitites/migration.account.entity';
import { MandateEntity } from '../../transactions/entities/mandate.entity';
import { parse } from 'path';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { uuid } from 'uuidv4';
import { TransferService } from '../../transfers/services/transfer.service';


const jsonDataToMigrate=[
    {
        "savingsGoalId": "7168a591-1546-49ff-8326-fcf58c2892b8",
        "savingGoalAccoutId": "NULL",
        "goalName": "my needs",
        "accountName": "my needs",
        "accountId": "e4c791f4-4db4-4acc-af1b-bf6425be4ffa"
    },
    {
        "savingsGoalId": "0aea4492-51d0-41ac-9696-ee178ab636b3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "fb0e3167-a8e6-4054-aa5b-d63754579010"
    },
    {
        "savingsGoalId": "0aea4492-51d0-41ac-9696-ee178ab636b3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "c286a7e8-ffb4-44ea-8124-6abbfe3d2008"
    },
    {
        "savingsGoalId": "0aea4492-51d0-41ac-9696-ee178ab636b3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "7d64a0ae-2c07-4558-98d1-8a2036584f6d"
    },
    {
        "savingsGoalId": "9b19d40d-e69d-4ec1-a93c-f69bb876e211",
        "savingGoalAccoutId": "NULL",
        "goalName": "School fees",
        "accountName": "School fees",
        "accountId": "fcf90a63-0891-4c39-b4f9-40d5e8378284"
    },
    {
        "savingsGoalId": "a45e291a-fed4-478e-b1b9-34250df535b3",
        "savingGoalAccoutId": "NULL",
        "goalName": "5000",
        "accountName": "5000",
        "accountId": "d44561fc-de37-471a-82d4-75afd9cf3e01"
    },
    {
        "savingsGoalId": "4bd8f439-b1a9-4ed0-b3b3-274d0f5839c0",
        "savingGoalAccoutId": "NULL",
        "goalName": "Qatar",
        "accountName": "Qatar",
        "accountId": "a5b6a9a9-3d6d-4f17-9a06-9cc6337bce41"
    },
    {
        "savingsGoalId": "d491287e-042e-48da-8342-a11b860ab48c",
        "savingGoalAccoutId": "NULL",
        "goalName": "3",
        "accountName": "3",
        "accountId": "ff873821-b6da-4ffe-b11a-b2dd4afca47e"
    },
    {
        "savingsGoalId": "fb071976-0153-4f94-a5b9-a896924ff3f8",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "fb0e3167-a8e6-4054-aa5b-d63754579010"
    },
    {
        "savingsGoalId": "fb071976-0153-4f94-a5b9-a896924ff3f8",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "c286a7e8-ffb4-44ea-8124-6abbfe3d2008"
    },
    {
        "savingsGoalId": "fb071976-0153-4f94-a5b9-a896924ff3f8",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "7d64a0ae-2c07-4558-98d1-8a2036584f6d"
    },
    {
        "savingsGoalId": "9727537a-8a3f-4b60-a30e-6415e48b54f3",
        "savingGoalAccoutId": "NULL",
        "goalName": "5000",
        "accountName": "5000",
        "accountId": "d44561fc-de37-471a-82d4-75afd9cf3e01"
    },
    {
        "savingsGoalId": "14ca41f3-0d0e-4d91-a3d3-02707dbf644c",
        "savingGoalAccoutId": "NULL",
        "goalName": "Me",
        "accountName": "Me",
        "accountId": "109ffd84-b3da-4576-b815-35aa8874e91f"
    },
    {
        "savingsGoalId": "412e5636-407e-4c88-8890-01839d56f8a8",
        "savingGoalAccoutId": "NULL",
        "goalName": "iphone",
        "accountName": "iphone",
        "accountId": "96fb7114-764e-4286-83c1-deed27ca4cb4"
    },
    {
        "savingsGoalId": "8e9ee6f0-05f4-4f1a-8912-ebd7af1d0dd4",
        "savingGoalAccoutId": "NULL",
        "goalName": "my needs",
        "accountName": "my needs",
        "accountId": "e4c791f4-4db4-4acc-af1b-bf6425be4ffa"
    },
    {
        "savingsGoalId": "7474bd6f-3f8d-4bf1-8605-639b8e875720",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "fb0e3167-a8e6-4054-aa5b-d63754579010"
    },
    {
        "savingsGoalId": "7474bd6f-3f8d-4bf1-8605-639b8e875720",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "c286a7e8-ffb4-44ea-8124-6abbfe3d2008"
    },
    {
        "savingsGoalId": "7474bd6f-3f8d-4bf1-8605-639b8e875720",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rogha",
        "accountName": "Rogha",
        "accountId": "7d64a0ae-2c07-4558-98d1-8a2036584f6d"
    },
    {
        "savingsGoalId": "09ddeb4d-2341-4bc4-806d-ac1e40574dfa",
        "savingGoalAccoutId": "NULL",
        "goalName": "2",
        "accountName": "2",
        "accountId": "9f3072f9-073e-45b6-a86c-dcb404d03572"
    },
    {
        "savingsGoalId": "542257d2-8b27-43ba-a99f-23433394dd33",
        "savingGoalAccoutId": "NULL",
        "goalName": "Junior Enterprise",
        "accountName": "Junior Enterprise",
        "accountId": "edcdb015-ebf5-45b7-a4ab-0ed949643df2"
    },
    {
        "savingsGoalId": "0ba13d4f-bb62-41e0-9d59-b2ceb1d1936b",
        "savingGoalAccoutId": "NULL",
        "goalName": "AMBIDEXTROUS COMPANY LTD",
        "accountName": "AMBIDEXTROUS COMPANY LTD",
        "accountId": "11d70161-593c-4602-905a-294655c64d72"
    },
    {
        "savingsGoalId": "a130b848-cb5c-4733-90d5-1ffd156be8c4",
        "savingGoalAccoutId": "NULL",
        "goalName": "My account",
        "accountName": "My account",
        "accountId": "d6eb5ef8-889f-41dd-9639-7a8df1c71c78"
    },
    {
        "savingsGoalId": "6abf4354-77b7-45b8-bd68-8b53bb025e21",
        "savingGoalAccoutId": "NULL",
        "goalName": "test",
        "accountName": "test",
        "accountId": "175ed444-3305-4a8a-9c61-173ee3692c32"
    },
    {
        "savingsGoalId": "1bcfb7c6-d276-4c4f-9329-3501b8874bd1",
        "savingGoalAccoutId": "NULL",
        "goalName": "SAMUEL",
        "accountName": "SAMUEL",
        "accountId": "1d456b07-98c6-4bc5-b5b8-2874f395342b"
    },
    {
        "savingsGoalId": "d7691971-705e-44a2-9b76-0e8cf96e2545",
        "savingGoalAccoutId": "NULL",
        "goalName": "Gladys Obesebea",
        "accountName": "Gladys Obesebea",
        "accountId": "2af08933-770d-4923-ae61-94d2334eef37"
    },
    {
        "savingsGoalId": "6e67b6ac-5883-4319-b055-7a1cf744f323",
        "savingGoalAccoutId": "NULL",
        "goalName": "my fees",
        "accountName": "my fees",
        "accountId": "b81f0fec-0bfe-4886-95e3-9312158176e8"
    },
    {
        "savingsGoalId": "df70de63-2c28-49a5-bf34-0a32612718a5",
        "savingGoalAccoutId": "NULL",
        "goalName": "Tricky de blinkz",
        "accountName": "Tricky de blinkz",
        "accountId": "23b006e9-a7fb-497c-8fad-c44bc17126bb"
    },
    {
        "savingsGoalId": "b1f56e58-8e5e-409f-827a-e3c5bb00af78",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "94545fba-0270-4d6c-9221-ed621b3bcb55"
    },
    {
        "savingsGoalId": "b1f56e58-8e5e-409f-827a-e3c5bb00af78",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "0b0e06e8-c487-415f-8069-3734a0976c1c"
    },
    {
        "savingsGoalId": "8babbee5-4f50-4beb-893a-7402d7accd0e",
        "savingGoalAccoutId": "NULL",
        "goalName": "Gladys Obesebea",
        "accountName": "Gladys Obesebea",
        "accountId": "2af08933-770d-4923-ae61-94d2334eef37"
    },
    {
        "savingsGoalId": "04aa8dbf-6585-491d-af81-c1a9ed05d86e",
        "savingGoalAccoutId": "NULL",
        "goalName": "Rapture",
        "accountName": "Rapture",
        "accountId": "bbd2d737-0384-4bb6-88ad-8134b70605e5"
    },
    {
        "savingsGoalId": "fcb8c261-2a9b-49bf-888a-a2a7f01fdfb9",
        "savingGoalAccoutId": "NULL",
        "goalName": "Christmas ",
        "accountName": "Christmas ",
        "accountId": "24786cfa-79d4-475a-bdd3-5d0a8a490914"
    },
    {
        "savingsGoalId": "7268d55d-d86d-47d4-9914-8bded07872d2",
        "savingGoalAccoutId": "NULL",
        "goalName": "Hustle",
        "accountName": "Hustle",
        "accountId": "cf25481a-c0e7-43de-9c84-7da82f1e206f"
    },
    {
        "savingsGoalId": "7268d55d-d86d-47d4-9914-8bded07872d2",
        "savingGoalAccoutId": "NULL",
        "goalName": "Hustle",
        "accountName": "Hustle",
        "accountId": "87474140-eb00-48d5-a184-923111ccd18a"
    },
    {
        "savingsGoalId": "6c0549b0-80bb-4f9e-9018-19a7aa56517e",
        "savingGoalAccoutId": "NULL",
        "goalName": "My future",
        "accountName": "My future",
        "accountId": "79952122-b5a7-4eb7-9192-a242055241d8"
    },
    {
        "savingsGoalId": "8f10da5d-9577-49ca-9158-cd3ccd4c24bd",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "a3bafbec-abf6-4eb2-9c03-7cbb18de4e91"
    },
    {
        "savingsGoalId": "698abb63-1934-480e-8201-033eea08ee5e",
        "savingGoalAccoutId": "NULL",
        "goalName": "Tricky de blinkz",
        "accountName": "Tricky de blinkz",
        "accountId": "23b006e9-a7fb-497c-8fad-c44bc17126bb"
    },
    {
        "savingsGoalId": "d0c252ef-c7d8-4abb-b3b7-e975d18ec4d9",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "94545fba-0270-4d6c-9221-ed621b3bcb55"
    },
    {
        "savingsGoalId": "d0c252ef-c7d8-4abb-b3b7-e975d18ec4d9",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "0b0e06e8-c487-415f-8069-3734a0976c1c"
    },
    {
        "savingsGoalId": "2dee205a-05e7-4aee-94dc-1f36094d3041",
        "savingGoalAccoutId": "NULL",
        "goalName": "Emergency",
        "accountName": "Emergency",
        "accountId": "8e04260b-35bd-4c42-9d66-bdb414b5a7db"
    },
    {
        "savingsGoalId": "b43ade5b-fd6e-4e6d-a896-5dc50da00204",
        "savingGoalAccoutId": "NULL",
        "goalName": "Sharp Sharp",
        "accountName": "Sharp Sharp",
        "accountId": "2bc4f7ae-f16f-45e2-b215-807dcb7bf5f7"
    },
    {
        "savingsGoalId": "355ff35d-548d-4b06-a285-ef20c4fd3505",
        "savingGoalAccoutId": "NULL",
        "goalName": "SMART ANTWORD EDUCATION",
        "accountName": "SMART ANTWORD EDUCATION",
        "accountId": "778ca1c9-121b-422f-9dab-9e43960aa16c"
    },
    {
        "savingsGoalId": "d82a10d4-231d-4349-9e28-59faf6c54df0",
        "savingGoalAccoutId": "NULL",
        "goalName": "0",
        "accountName": "0",
        "accountId": "9070bbb8-2e36-48f7-9118-8954d71b9bd1"
    },
    {
        "savingsGoalId": "ae8418f2-657a-48b5-bd47-7bc110c8046b",
        "savingGoalAccoutId": "NULL",
        "goalName": "Cliford ent",
        "accountName": "Cliford ent",
        "accountId": "89416fd1-dbb2-45b9-9164-73d3b6e9f78b"
    },
    {
        "savingsGoalId": "de739605-9cf5-4652-89fe-984a11ebfd22",
        "savingGoalAccoutId": "NULL",
        "goalName": "Qatar ",
        "accountName": "Qatar ",
        "accountId": "f5583664-17ea-4c05-b0e1-129f94fd4444"
    },
    {
        "savingsGoalId": "a42ea4a1-0ce0-426d-b7b7-6e026e9f3cc3",
        "savingGoalAccoutId": "NULL",
        "goalName": "School fees",
        "accountName": "School fees",
        "accountId": "1a2ceb25-723e-42a9-a1a1-1e9b5f940245"
    },
    {
        "savingsGoalId": "b75f2afd-f5f1-4b60-b34f-7973143b4c4c",
        "savingGoalAccoutId": "NULL",
        "goalName": "Kosam",
        "accountName": "Kosam",
        "accountId": "8a33e70a-6ac3-43bc-851f-8837a9fcb2d3"
    },
    {
        "savingsGoalId": "b75f2afd-f5f1-4b60-b34f-7973143b4c4c",
        "savingGoalAccoutId": "NULL",
        "goalName": "Kosam",
        "accountName": "Kosam",
        "accountId": "8d90d2b3-6a34-4279-b40d-11a983a14e14"
    },
    {
        "savingsGoalId": "8c22e976-4b5a-48e8-9b33-a645cc2708b8",
        "savingGoalAccoutId": "NULL",
        "goalName": "fg",
        "accountName": "fg",
        "accountId": "4c6767c9-f00e-4a2a-9e55-dcececad9cbf"
    },
    {
        "savingsGoalId": "ebd1e51f-5bc0-419d-9fcb-dd9d6e6da618",
        "savingGoalAccoutId": "NULL",
        "goalName": "4",
        "accountName": "4",
        "accountId": "06ca1943-39c7-4c34-9a59-2b1d85abbbfc"
    },
    {
        "savingsGoalId": "04f1dd40-90d3-4b38-91b1-3852c012aa03",
        "savingGoalAccoutId": "NULL",
        "goalName": "Camp",
        "accountName": "Camp",
        "accountId": "ec88822a-d4d2-4adc-8558-7d3ed39967c3"
    },
    {
        "savingsGoalId": "e3b364fa-06e0-4ebd-9d56-d59de6dcf38e",
        "savingGoalAccoutId": "NULL",
        "goalName": "rogha",
        "accountName": "rogha",
        "accountId": "5766a9da-d60b-46ad-9b71-d7e83809593e"
    },
    {
        "savingsGoalId": "2d52fb1b-3744-4db8-98eb-b6b9f89f21e5",
        "savingGoalAccoutId": "NULL",
        "goalName": "My Fees",
        "accountName": "My Fees",
        "accountId": "7ae9ed0c-b9f7-4574-ada0-b659b31fa7cf"
    },
    {
        "savingsGoalId": "a1e0bfbb-e722-4f1e-aab6-c69e13ce1222",
        "savingGoalAccoutId": "NULL",
        "goalName": "Save me",
        "accountName": "Save me",
        "accountId": "92040a19-1f1a-4b50-b375-b0747a3df1ea"
    },
    {
        "savingsGoalId": "e913c4c6-5a5a-42e1-999b-40f5f9d398cc",
        "savingGoalAccoutId": "NULL",
        "goalName": "Ha",
        "accountName": "Ha",
        "accountId": "807aadef-72c1-471d-9151-137013050b17"
    },
    {
        "savingsGoalId": "72046a3a-0c45-41a8-98fd-5cf7687bef88",
        "savingGoalAccoutId": "NULL",
        "goalName": "My Rent",
        "accountName": "My Rent",
        "accountId": "70c68fe4-7121-440c-870c-2b9f7162a404"
    },
    {
        "savingsGoalId": "76f71b00-23b3-4fc5-80c7-0386fe4586a1",
        "savingGoalAccoutId": "NULL",
        "goalName": "Tithe ",
        "accountName": "Tithe ",
        "accountId": "214400ac-3795-4599-8b9b-fc863c6ee2c4"
    },
    {
        "savingsGoalId": "72734dcb-45eb-4b25-a53a-b872a8c9dad6",
        "savingGoalAccoutId": "NULL",
        "goalName": "Kosam",
        "accountName": "Kosam",
        "accountId": "8a33e70a-6ac3-43bc-851f-8837a9fcb2d3"
    },
    {
        "savingsGoalId": "72734dcb-45eb-4b25-a53a-b872a8c9dad6",
        "savingGoalAccoutId": "NULL",
        "goalName": "Kosam",
        "accountName": "Kosam",
        "accountId": "8d90d2b3-6a34-4279-b40d-11a983a14e14"
    },
    {
        "savingsGoalId": "afe3feb8-0221-44cd-be01-26cd7b1128bd",
        "savingGoalAccoutId": "NULL",
        "goalName": "HOSTINY",
        "accountName": "HOSTINY",
        "accountId": "e3410be5-c843-4543-9b1a-f5bdeced5d92"
    },
    {
        "savingsGoalId": "19750bfc-2f67-49a4-aa51-27fa91e9b05c",
        "savingGoalAccoutId": "NULL",
        "goalName": "5",
        "accountName": "5",
        "accountId": "73ff1131-65bf-4a63-994f-018a59924ba9"
    },
    {
        "savingsGoalId": "2a854be2-b6c1-4169-888a-5b692980eda0",
        "savingGoalAccoutId": "NULL",
        "goalName": "Money",
        "accountName": "Money",
        "accountId": "02bb289a-ac69-4560-8716-c1bcfa3b0d04"
    },
    {
        "savingsGoalId": "2a854be2-b6c1-4169-888a-5b692980eda0",
        "savingGoalAccoutId": "NULL",
        "goalName": "Money",
        "accountName": "Money",
        "accountId": "23638c78-feed-4489-99ae-0a6ce6be5247"
    },
    {
        "savingsGoalId": "1e268182-fa5e-46bf-bcbc-b9b7302c30d1",
        "savingGoalAccoutId": "NULL",
        "goalName": "Money",
        "accountName": "Money",
        "accountId": "02bb289a-ac69-4560-8716-c1bcfa3b0d04"
    },
    {
        "savingsGoalId": "1e268182-fa5e-46bf-bcbc-b9b7302c30d1",
        "savingGoalAccoutId": "NULL",
        "goalName": "Money",
        "accountName": "Money",
        "accountId": "23638c78-feed-4489-99ae-0a6ce6be5247"
    },
    {
        "savingsGoalId": "3b52f61c-641b-4040-9b19-cf09ac6d2211",
        "savingGoalAccoutId": "NULL",
        "goalName": "GODFRED",
        "accountName": "GODFRED",
        "accountId": "42233bea-eec2-4f22-9a12-9e484d780534"
    },
    {
        "savingsGoalId": "a1bca145-7712-464a-92b4-66fee487b663",
        "savingGoalAccoutId": "NULL",
        "goalName": "5",
        "accountName": "5",
        "accountId": "73ff1131-65bf-4a63-994f-018a59924ba9"
    },
    {
        "savingsGoalId": "076b9e98-d4a8-4af3-bf31-f463d1923477",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "3381680a-9c2c-48f2-81db-1d4bc75f66b0"
    },
    {
        "savingsGoalId": "076b9e98-d4a8-4af3-bf31-f463d1923477",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "466d4ac3-5a95-4e8a-b7dc-3d80390bd3b1"
    },
    {
        "savingsGoalId": "076b9e98-d4a8-4af3-bf31-f463d1923477",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "5d5ab6ca-4f7f-4a56-9540-3e684471da22"
    },
    {
        "savingsGoalId": "076b9e98-d4a8-4af3-bf31-f463d1923477",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "d9eedc26-6c03-4100-b15d-125b06c5005d"
    },
    {
        "savingsGoalId": "6b172a20-70aa-4e52-a6f9-2515a284b102",
        "savingGoalAccoutId": "NULL",
        "goalName": "business-test",
        "accountName": "business-test",
        "accountId": "71b4707f-073b-4aae-85f7-d77215865651"
    },
    {
        "savingsGoalId": "ed9095bc-fbbf-45d8-97be-e6494a521034",
        "savingGoalAccoutId": "NULL",
        "goalName": "DANIEL OBENG",
        "accountName": "DANIEL OBENG",
        "accountId": "0b659799-67da-48bd-beae-cc518dd4934f"
    },
    {
        "savingsGoalId": "278ab63a-5662-491e-ae71-de9a1851b7b7",
        "savingGoalAccoutId": "NULL",
        "goalName": "Armah money",
        "accountName": "Armah money",
        "accountId": "9c962130-7ace-412a-a45e-8cbbafbdd39e"
    },
    {
        "savingsGoalId": "9fcc14f1-794d-4b4c-9092-389eb786eaf9",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "3381680a-9c2c-48f2-81db-1d4bc75f66b0"
    },
    {
        "savingsGoalId": "9fcc14f1-794d-4b4c-9092-389eb786eaf9",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "466d4ac3-5a95-4e8a-b7dc-3d80390bd3b1"
    },
    {
        "savingsGoalId": "9fcc14f1-794d-4b4c-9092-389eb786eaf9",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "5d5ab6ca-4f7f-4a56-9540-3e684471da22"
    },
    {
        "savingsGoalId": "9fcc14f1-794d-4b4c-9092-389eb786eaf9",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "d9eedc26-6c03-4100-b15d-125b06c5005d"
    },
    {
        "savingsGoalId": "2b84df7c-7aa4-4ca5-b175-4c98c398dc77",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "3381680a-9c2c-48f2-81db-1d4bc75f66b0"
    },
    {
        "savingsGoalId": "2b84df7c-7aa4-4ca5-b175-4c98c398dc77",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "466d4ac3-5a95-4e8a-b7dc-3d80390bd3b1"
    },
    {
        "savingsGoalId": "2b84df7c-7aa4-4ca5-b175-4c98c398dc77",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "5d5ab6ca-4f7f-4a56-9540-3e684471da22"
    },
    {
        "savingsGoalId": "2b84df7c-7aa4-4ca5-b175-4c98c398dc77",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "d9eedc26-6c03-4100-b15d-125b06c5005d"
    },
    {
        "savingsGoalId": "284eb7b2-ab29-48ad-86c7-b36559874b7e",
        "savingGoalAccoutId": "NULL",
        "goalName": "EgoHappen",
        "accountName": "EgoHappen",
        "accountId": "e3af722b-bdbf-46d0-b9e5-c3a3d5d057fa"
    },
    {
        "savingsGoalId": "98170148-3e04-41a1-8dd4-a7f327dee937",
        "savingGoalAccoutId": "NULL",
        "goalName": "FB",
        "accountName": "FB",
        "accountId": "708cbbab-9749-4517-ac76-609a6fe691a5"
    },
    {
        "savingsGoalId": "ece4b7c3-8c13-4204-b9e1-e8b11547f218",
        "savingGoalAccoutId": "NULL",
        "goalName": "Ayomah Wilfred",
        "accountName": "Ayomah Wilfred",
        "accountId": "34cc275c-2422-4d35-99cd-68b5bc2b340f"
    },
    {
        "savingsGoalId": "226dc5a0-f5e7-45ac-8b1a-b19e2841a6ff",
        "savingGoalAccoutId": "NULL",
        "goalName": "75",
        "accountName": "75",
        "accountId": "84d26524-0fbc-4081-8ef4-01226b0c6b7c"
    },
    {
        "savingsGoalId": "fdc4bc69-4d14-4e27-a7ad-bedc8f39b996",
        "savingGoalAccoutId": "NULL",
        "goalName": "DANIEL OBENG",
        "accountName": "DANIEL OBENG",
        "accountId": "0b659799-67da-48bd-beae-cc518dd4934f"
    },
    {
        "savingsGoalId": "af98e3ce-5b7f-4b49-a5af-3715bbfbbde7",
        "savingGoalAccoutId": "NULL",
        "goalName": "Testing",
        "accountName": "Testing",
        "accountId": "1ad79aac-b81f-4393-a609-7a134f768cfe"
    },
    {
        "savingsGoalId": "1d65850b-f3ab-4f68-97a0-fc8c894b1586",
        "savingGoalAccoutId": "NULL",
        "goalName": "MY R",
        "accountName": "MY R",
        "accountId": "c24ff11f-b332-45a8-9387-aeca439493db"
    },
    {
        "savingsGoalId": "64254628-5cb9-45bc-85e6-92f366c2175d",
        "savingGoalAccoutId": "NULL",
        "goalName": "test",
        "accountName": "test",
        "accountId": "54b052b4-c1ff-4699-972c-e9d4d3ab1382"
    },
    {
        "savingsGoalId": "6a0fcb5d-d9b3-4763-bd4e-aeb5b954e1d3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "3381680a-9c2c-48f2-81db-1d4bc75f66b0"
    },
    {
        "savingsGoalId": "6a0fcb5d-d9b3-4763-bd4e-aeb5b954e1d3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "466d4ac3-5a95-4e8a-b7dc-3d80390bd3b1"
    },
    {
        "savingsGoalId": "6a0fcb5d-d9b3-4763-bd4e-aeb5b954e1d3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "5d5ab6ca-4f7f-4a56-9540-3e684471da22"
    },
    {
        "savingsGoalId": "6a0fcb5d-d9b3-4763-bd4e-aeb5b954e1d3",
        "savingGoalAccoutId": "NULL",
        "goalName": "Star",
        "accountName": "Star",
        "accountId": "d9eedc26-6c03-4100-b15d-125b06c5005d"
    },
    {
        "savingsGoalId": "3733c2e4-6cd5-4133-a0fe-fd3066fd0ce4",
        "savingGoalAccoutId": "NULL",
        "goalName": "Kbeatz entreprise",
        "accountName": "Kbeatz entreprise",
        "accountId": "98436a0b-8512-483c-b36e-a2a419d7fa02"
    },
    {
        "savingsGoalId": "9699bbd4-3a88-453e-b604-f0b34bd357b7",
        "savingGoalAccoutId": "NULL",
        "goalName": "Ayomah wilfred",
        "accountName": "Ayomah wilfred",
        "accountId": "7b2c905b-d839-49d5-a8a6-c9e3fd776205"
    },
    {
        "savingsGoalId": "08f430bb-e1f2-49a0-82a8-913efc8b3893",
        "savingGoalAccoutId": "NULL",
        "goalName": "clothing",
        "accountName": "clothing",
        "accountId": "fb0f1649-ca2b-4ab9-befb-03ba57064804"
    },
    {
        "savingsGoalId": "0ccf339b-6b5a-4a27-a918-3126a23def0e",
        "savingGoalAccoutId": "NULL",
        "goalName": "DANIEL OBENG",
        "accountName": "DANIEL OBENG",
        "accountId": "0b659799-67da-48bd-beae-cc518dd4934f"
    },
    {
        "savingsGoalId": "42de022c-5d33-4ee9-aa3d-fdc090ff25e0",
        "savingGoalAccoutId": "NULL",
        "goalName": "Gasty",
        "accountName": "Gasty",
        "accountId": "a30a4537-8675-4dee-baf7-f9cdc1f905cf"
    },
    {
        "savingsGoalId": "64bc2a70-9594-4c7f-acfc-240896764b91",
        "savingGoalAccoutId": "NULL",
        "goalName": "Fees",
        "accountName": "Fees",
        "accountId": "4180ff7d-54ef-41f3-a04a-31a5fc217d81"
    },
    {
        "savingsGoalId": "ab4b0c08-285a-4a51-98c0-9de0e4686a70",
        "savingGoalAccoutId": "NULL",
        "goalName": "New phone ",
        "accountName": "New phone ",
        "accountId": "ac4d80ba-ded9-4587-ab01-1d6314b968b9"
    },
    {
        "savingsGoalId": "e48e2c20-0666-4af3-a5a0-6956063e884a",
        "savingGoalAccoutId": "NULL",
        "goalName": "Woodman",
        "accountName": "Woodman",
        "accountId": "b121bdac-d192-4492-b405-160107a88040"
    },
    {
        "savingsGoalId": "4fdd4cba-2b53-4327-b4a5-1a5a5043241c",
        "savingGoalAccoutId": "NULL",
        "goalName": "OBENG DANIEL SAVING ACCOUNT",
        "accountName": "OBENG DANIEL SAVING ACCOUNT",
        "accountId": "0a930736-e57a-4419-8392-8b3ce3f7ccee"
    }
]


@Console()
export class MigrateAccountIdInSavingGoalCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,
    //private transferService: TransferService
  ) {
    //this.db = this.connection.useDb('bezosusuDBLive')
  
  }

  @Command({
    command: 'migrate:accountIds-savingsgoal',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }




  async _execute(opts?: any) {
    console.log("migrating account ids in savings goals")
    await this.migrateAccountIds(opts?.type);
  }


//   async getAccountTypes() {
//     const accountTypes = await this.db
//       .collection('account_type')
//       .find()
//       .toArray();
//     return accountTypes;
//   }


  async migrateAccountIds(type?: string) {

   const results= await Promise.all(
        jsonDataToMigrate.map(async(r)=>{
            try {
               
           
                let result : SavingsGoalEntity=await this.em.findOne(SavingsGoalEntity,{
                    where: {id:r.savingsGoalId, accountId: null}
                }) 
               // console.log("ee",result)

               result.accountId=r.accountId
              //  console.log("ee",result)
                await this.em.save(result)

            } catch (error) {
                console.log("Account Id with error",r.accountId)
                console.log("SavingGoal Id with error",r.savingGoalAccoutId)
              console.log("Got an Error >>>>",JSON.stringify(error))
            }
        })
    )
    //

 

    console.log("res",results, results.length)
 


  }


  
}
