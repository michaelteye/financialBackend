import { Body, Controller, Delete, Get, Param, Post,Put,UseGuards,UsePipes } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common/pipes";
import { ApiBearerAuth, ApiBody, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { isUUID } from "class-validator";
import { MixedAuthGuard } from "../../auth/guards/mixed-auth.guard";
import { RoleAuth, RoleAuthGuard } from "../../auth/guards/role-auth.guard";
import { AuthUserRole } from "../../auth/types/auth-user.roles";
import { AddGroupMemberDto } from "../dtos/add-group-member-dto";
import { AddGroupSavingMemberDto } from "../dtos/add-member-to-group-savinggoal";
import { GroupDto, GroupDtoInput } from "../dtos/group-dto";
import { GroupSavingsGoalInputDto } from "../dtos/group-savings-goal.dto";
import { GroupGoalMemberEntity } from "../entities/group-goal-member.entity";
import { GROUP_MEMBERS_STATUS } from "../enums/group-members-status";
import { GroupService } from "../services/group-service";

@ApiTags('Groups / Create Group / Invite Members / Savings Goals')
@ApiBearerAuth('JWT')
@Controller('users/group')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class GroupController {

    constructor(private groupService: GroupService) {}

    @RoleAuth(AuthUserRole.User)
    @Post('create')
    @ApiBody({type: GroupDto})

    async createGroup(@Body() group: GroupDtoInput) {
        return this.groupService.createGroup(group);
    }

    @RoleAuth(AuthUserRole.User)
    @Post('add/member')
    @ApiBody({type: GroupDto})

    async addMemberToGroup(@Body() group: AddGroupMemberDto) {
        return this.groupService.addMemberToGroup(group);
    }


    @RoleAuth(AuthUserRole.User)
    @Post('savings-goal/create')
    @ApiBody({type: GroupSavingsGoalInputDto})

    async creategroupSavingsGoal(@Body() group: GroupSavingsGoalInputDto) {
        return this.groupService.creategroupSavingsGoal(group);
    }


    @RoleAuth(AuthUserRole.User)
    @Post('savings-goal/add/member')
    @ApiBody({type: GroupDto})

    async addMemberToGroupSavingsGoal(@Body() group: AddGroupSavingMemberDto):Promise<GroupGoalMemberEntity> {
        return this.groupService.addMemberToGroupSavingsGoal(group);
    }





    // @RoleAuth(AuthUserRole.User)
    // @Delete('member')
    // @ApiBody({type: GroupDto})

    // async removeMemberToGroup(@Body() group: AddGroupMemberDto) {
    //     return this.groupService.addMemberToGroup(group);
    // }



 
    @RoleAuth(AuthUserRole.User)
    @Delete(':groupId/:userId')
    @ApiParam({ name: 'groupId', required: true, type: String })
    @ApiParam({ name: 'userId', required: true, type: String })
    @ApiResponse({
      status: 200,
    })
    async delete(@Param('userId') userId: any, @Param('groupId') groupId: string): Promise<any> {
     
        console.log(userId,groupId)
        if (userId && !isUUID(userId))
        throw new Error(
          `Invalid id, UUID format expected but received ${userId.id}`,
        );

        if (groupId && !isUUID(groupId))
        throw new Error(
          `Invalid id, UUID format expected but received ${groupId}`,
        );
      await this.groupService.removeMemberToGroup(userId,groupId);
    }


    @RoleAuth(AuthUserRole.User)
    @Put(':groupId/:userId')
    @ApiParam({ name: 'groupId', required: true, type: String })
    @ApiParam({ name: 'userId', required: true, type: String })
    @ApiResponse({
      status: 200,
    })
    
    async updateGroupMemberStatus(  @Body() status: GROUP_MEMBERS_STATUS, //: { name: string },
    @Param('userId') userId: any, @Param('groupId') groupId: string): Promise<any> {
     
        console.log(userId,groupId)
        if (userId && !isUUID(userId))
        throw new Error(
          `Invalid id, UUID format expected but received ${userId.id}`,
        );

        if (groupId && !isUUID(groupId))
        throw new Error(
          `Invalid id, UUID format expected but received ${groupId}`,
        );
     return  await this.groupService.updateGroupMemberStatus(userId,groupId,status);
    }


    @RoleAuth(AuthUserRole.User)
    @Get(':groupId')
    @ApiParam({ name: 'groupId', required: true, type: String })
    @ApiResponse({
      status: 200,
    })
    async getMembersofaGroup( @Param('groupId') groupId: string): Promise<any> {
     
        if (groupId && !isUUID(groupId))
        throw new Error(
          `Invalid id, UUID format expected but received ${groupId}`,
        );

        if (groupId && !isUUID(groupId))
        throw new Error(
          `Invalid id, UUID format expected but received ${groupId}`,
        );
     return  await this.groupService.getMembersofaGroup(groupId);
    }
  

}