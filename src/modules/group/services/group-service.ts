import { HttpException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { isBefore } from 'date-fns';
import { AccountEntity } from '../../account/entities/account.entity';
import { AccountTypeService } from '../../account/services/account-type.service';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { SavingsGoalInputDto } from '../../savings-goal/dtos/savings-goal.dto';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { generateCode } from '../../../utils/shared';
import { EntityManager, In } from 'typeorm';
import { AddGroupMemberDto } from '../dtos/add-group-member-dto';
import { AddGroupSavingMemberDto } from '../dtos/add-member-to-group-savinggoal';
import { GroupDto, GroupDtoInput } from '../dtos/group-dto';
import { GroupSavingsGoalInputDto } from '../dtos/group-savings-goal.dto';
import { GroupGoalMemberEntity } from '../entities/group-goal-member.entity';
import { GroupMemberEntity } from '../entities/group-member.entity';
import { GroupSavingsGoalsEntity } from '../entities/group-savings-goal.entity';
import { GroupEntity, GroupsDto } from '../entities/group.entity';
import { GroupMemberRole } from '../enums/group-member';
import { GROUP_MEMBERS_STATUS } from '../enums/group-members-status';

export class GroupService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,

    private accountTypeService: AccountTypeService,
  ) {}
  /**
   *
   * @param input
   * @returns returns a group after being created.
   */
  async createGroup(input: GroupDtoInput): Promise<GroupDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    console.log('ctx', ctx);

    ///CHECK IF USER HAS CREATED A GROUP WITH THE SAME NAME
    const checkExistence = await this.checkIfGroupExist(
      ctx.authUser.userId,
      input.name,
    );

    if (checkExistence) {
      throw new HttpException('User has a group name that already exist ', 400);
    }

    const accountType = await this.accountTypeService.getAccountTypeById(
      input.accountTypeId,
    );

    if (
      !accountType &&
      ['default_group'].includes(accountType.alias) === false
    ) {
      throw new HttpException('Account type not found ', 404);
    }

    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    console.log('The user Id is >>>', ctx.authUser.userId);
    account.userId = ctx.authUser.userId;
    account.accountNumber = '' + Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    account.allowDeposit = accountType.allowDeposit;
    account.allowWithdrawal = accountType.allowWithdrawal;
    account.allowWithdrawalWithFees = accountType.allowWithdrawalWithFees;
    account.dailyLimit = accountType.dailyLimit;
    account.canOverDraw = false;

    await this.em.save(account);

    try {
      const inputToGroup = {
        ...input,
        accountId: account.id,
        userId: ctx.authUser.userId,
      };

      const group = await this.em.save(GroupEntity, inputToGroup);

      // const adminAsMemberPayload = new AddGroupMemberDto();
      // adminAsMemberPayload.role = GroupMemberRole.ADMIN;
      // adminAsMemberPayload.groupId = group.id;

      // adminAsMemberPayload.userId = ctx.authUser.userId;

      // await this.addMemberToGroup(adminAsMemberPayload);

      const groupMember = new GroupMemberEntity();
      groupMember.userId = ctx.authUser.userId
      groupMember.role = GroupMemberRole.ADMIN;
      groupMember.status = GROUP_MEMBERS_STATUS.ACTIVE;

      groupMember.groupId = group.id;

      console.log('groupMember', groupMember);

      await this.em.save(GroupMemberEntity, groupMember);

      return group;
    } catch (error) {
      console.log('error creating group', error);
    }
  }

  async addMemberToGroup(input: AddGroupMemberDto): Promise<GroupMemberEntity> {
    console.log('AddGroupMemberDto', input);

    const ctx = getAppContextALS<AppRequestContext>();

    const group = await this.getGroupById(input.groupId);

    if (!group) {
      throw new HttpException('Group not found', 404);
    }

    const checkifAdmin = this.checkifUserIsAdmininGroup(
      ctx.authUser.userId,
      input.groupId,
    );

    if (!checkifAdmin) {
      throw new HttpException("You don't have permission to add member", 400);
    }

    /// check user existence
    const user = await this.getAuthUserByUserId(input.userId);

    if (!user) {
      throw new HttpException('user not found', 404);
    }

    /// check if the person adding another user is an admin

    const groupMember = new GroupMemberEntity();
    groupMember.userId = input.userId;
    groupMember.role = GroupMemberRole.CONTRIBUTOR;
    groupMember.status =
      input.role === GroupMemberRole.ADMIN
        ? GROUP_MEMBERS_STATUS.ACTIVE
        : GROUP_MEMBERS_STATUS.PENDING;
    groupMember.groupId = input.groupId;

    console.log('groupMember', groupMember);

    return await this.em.save(GroupMemberEntity, groupMember);
  }

  async addMemberToGroupSavingsGoal(
    input: AddGroupSavingMemberDto,
  ): Promise<GroupGoalMemberEntity> {
    console.log('AddGroupMemberDto', input);

    const ctx = getAppContextALS<AppRequestContext>();

    const group = await this.getGroupById(input.groupId);

    if (!group) {
      throw new HttpException('Group not found', 404);
    }

    const checkifAdmin = this.checkifUserIsAdmininGroup(
      ctx.authUser.userId,
      input.groupId,
    );

    if (!checkifAdmin) {
      throw new HttpException("You don't have permission to add member", 400);
    }

    /// check user existence
    const user = await this.getAuthUserByUserId(input.userId);

    if (!user) {
      throw new HttpException('user not found', 404);
    }

    /// check if the person adding another user is an admin

    const groupgoalMember = new GroupGoalMemberEntity();
    groupgoalMember.userId = input.userId;

    groupgoalMember.groupSavingsGoalId = input.groupSavingsGoalId;
    groupgoalMember.groupId = input.groupId;

    return await this.em.save(GroupMemberEntity, groupgoalMember);
  }

  async creategroupSavingsGoal(input: GroupSavingsGoalInputDto): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    const checkifAdmin = this.checkifUserIsAdmininGroup(
      ctx.authUser.userId,
      input.groupId,
    );

    if (!checkifAdmin) {
      throw new HttpException(
        "You don't have permission to create a group savings goal",
        400,
      );
    }

    if (await this.groupsavingsGoalExist(input.name, input.groupId)) {
      return {
        status: 'FAILED',
        message: `Savings Goal with name ${input.name} already exist in this group`,
      };
    }
    const accountType = await this.accountTypeService.getAccountTypeById(
      input.accountTypeId,
    );

    if (
      !accountType ||
      ['default_group'].includes(accountType.alias) === false
    ) {
      throw new HttpException('Account type not found ', 404);
    }

    const accountExist = await this.checkifAccountNameExist(
      input.name,
      ctx.authUser.userId,
    );
    if (accountExist) {
      throw new HttpException(
        `You already have a group savings goal with the ${input.name}`,
        400,
      );
    }

    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    console.log('The user Id is >>>', ctx.authUser.userId);
    account.userId = ctx.authUser.userId;
    account.accountNumber = '' + Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    account.allowDeposit = accountType.allowDeposit;
    account.allowWithdrawal = accountType.allowWithdrawal;
    account.allowWithdrawalWithFees = accountType.allowWithdrawalWithFees;
    account.dailyLimit = accountType.dailyLimit;
    account.canOverDraw = false;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const checkStartDate =
      typeof input.startDate === 'string'
        ? new Date(input.startDate)
        : input.startDate;
    const checkEndDate =
      typeof input.endDate === 'string'
        ? new Date(input.endDate)
        : input.endDate;

    if (isBefore(currentDate, checkStartDate) === true) {
      throw new HttpException('You cannot use a past date', 400);
    }

    if (isBefore(checkEndDate, checkStartDate) === true) {
      throw new HttpException('Start date must be before end date', 400);
    }

    const savedAccount = await this.em.save(account);
    const groupsavingsGoal = new GroupSavingsGoalsEntity();
    groupsavingsGoal.name = input.name;
    //  groupsavingsGoal.account=account
    groupsavingsGoal.description = input.description;
    groupsavingsGoal.goalTypeId = input.goalTypeId;
    groupsavingsGoal.accountId = savedAccount.id;
    groupsavingsGoal.amountToRaise = input.amount;
    groupsavingsGoal.amountToSave = input.amountToSave;
    groupsavingsGoal.preference = input.preference;
    groupsavingsGoal.period = input.period;
    groupsavingsGoal.startDate = checkStartDate;
    groupsavingsGoal.endDate = checkEndDate;
    groupsavingsGoal.goalStatus = GOAL_STATUS.INPROGRESS;
    groupsavingsGoal.groupId = input.groupId;
    groupsavingsGoal.frequency = input.frequency;
    groupsavingsGoal.emoji = input.emoji;
    groupsavingsGoal.lockSaving = false;
    groupsavingsGoal.creatorId = ctx.authUser.userId;
    // groupsavingsGoal.preference = DEPOSIT_PREFERENCE.manual;//TODO re
    let savedGoal = await this.em.save(groupsavingsGoal);
    // if (savedGoal.preference == DEPOSIT_PREFERENCE.automatic) {
    //   const createMandate = new CreateMandateDto();
    //   createMandate.accountId = groupsavingsGoal.accountId;
    //   createMandate.amount = input.amountToSave;
    //   createMandate.frequency = input.frequency;
    //   createMandate.phoneNumber = ctx.authUser.phone;
    //   createMandate.startDate = format(
    //     new Date(savedGoal.startDate),
    //     'yyyy-MM-dd',
    //   );
    //   createMandate.endDate = format(
    //     new Date(groupsavingsGoal.endDate),
    //     'yyyy-MM-dd',
    //   );
    //   let mandateResult = await this.mandateService.create(createMandate);
    //   console.log('Create mandate result >>', mandateResult);
    //   this.logger.log(JSON.stringify(mandateResult), 'create mandate result');
    // }
    let retResponse: any = {
      status: 'SUCCESS',
      message: 'Group savings goal created successfully',
    };
    console.log('Deposit preference >>');
    return retResponse;
  }

  async groupsavingsGoalExist(name: string, groupId: string) {
    return await this.em.findOne(GroupSavingsGoalsEntity, {
      where: { name: name, groupId: groupId },
    });
  }

  async checkifAccountNameExist(
    name: string,
    userId: string,
  ): Promise<AccountEntity> {
    return await this.em.findOne(AccountEntity, {
      where: { name, userId },
    });
  }

  async removeMemberToGroup(userId: string, groupId: string): Promise<void> {
    console.log('userid', userId, 'groupid', groupId);

    const group = await this.getGroupById(groupId);

    if (!group) {
      throw new HttpException('Group not found', 404);
    }

    const member = await this.findGroupMemberByGroupIdAndUserId(
      groupId,
      userId,
    );

    if (!member) {
      throw new HttpException('Member does not exit in group', 404);
    }

    if (member.role != GroupMemberRole.ADMIN) {
      throw new HttpException("You don't have permission to delete", 400);
    }

    if (member.role == GroupMemberRole.ADMIN && member.groupId == groupId) {
      await this.em.delete(GroupMemberEntity, {
        groupId,
        userId,
      });
    } else {
      throw new HttpException("You don't have permission to delete", 400);
    }

    // const query=`DELETE FROM group_member_entity where "groupId"='${}'`
  }

  async updateGroupMemberStatus(
    userId: string,
    groupId: string,
    status: GROUP_MEMBERS_STATUS,
  ): Promise<GroupMemberEntity> {
    console.log('userid', userId, 'groupid', groupId);

    const group = await this.getGroupById(groupId);

    if (!group) {
      throw new HttpException('Group not found', 404);
    }

    const member = await this.findGroupMemberByGroupIdAndUserId(
      groupId,
      userId,
    );

    if (!member) {
      throw new HttpException('Member does not exit in group', 404);
    }

    member.status = status;
    await this.em.save(member);

    return member;
  }

  async getMembersofaGroup(groupId: string): Promise<GroupMemberEntity[]> {
    const group = await this.getGroupById(groupId);

    if (!group) {
      throw new HttpException('Group not found', 404);
    }

    return await this.getGroupMembers(groupId);
  }

  async getGroupMembers(groupId: string): Promise<GroupMemberEntity[]> {
    return this.em.find(GroupMemberEntity, {
      where: {
        groupId: groupId,
        status: In([
          GROUP_MEMBERS_STATUS.ACTIVE,
          GROUP_MEMBERS_STATUS.PENDING,
          GROUP_MEMBERS_STATUS.INACTIVE,
        ]),
      },
    });
  }

  async getAuthUserByUserId(userId: string): Promise<AuthUserEntity> {
    const authUser = await this.em.findOne(AuthUserEntity, {
      where: { userId: userId },
      relations: ['user'],
    });
    return authUser;
  }

  async checkifUserIsAdmininGroup(
    userId: string,
    groupId: string,
  ): Promise<GroupMemberEntity> {
    const user = await this.em.findOne(GroupMemberEntity, {
      where: { userId: userId, groupId: groupId },
    });
    return user;
  }

  async getGroupById(id: string): Promise<GroupEntity> {
    return this.em.findOne(GroupEntity, {
      where: {
        id: id,
      },
    });
  }

  async findGroupMemberByGroupIdAndUserId(
    groupId: string,
    userId: string,
  ): Promise<GroupMemberEntity> {
    return this.em.findOne(GroupMemberEntity, {
      where: {
        userId,
        groupId,
      },
    });
  }

  async checkIfGroupExist(userId: string, name: string): Promise<any> {
    this.em.findOne(GroupEntity, {
      where: {
        userId,
        name,
      },
    });
  }

  async getDefaultWalletId(): Promise<string> {
    return this.em
      .findOne(WalletTypeEntity, { where: { name: 'Local' } })
      .then((wallet) => wallet.id);
  }
}
