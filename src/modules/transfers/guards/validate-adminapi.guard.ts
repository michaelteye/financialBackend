import { ExecutionContext, Injectable, CanActivate, NotFoundException } from '@nestjs/common';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';
import { UserService } from '../../auth/services/user.service';

@Injectable()
export class ValidateAdminTransactionAuthGuard implements CanActivate {
    constructor(private readonly userService: UserService) { }
    
    getRequest(context: ExecutionContext) {
        const type = context.getType();
        if (type === 'http') {
            const ctx = context.switchToHttp();
            return ctx.getRequest();
        } else {
            throw new Error('Unsupported execution type');
        }
    }
   
    async canActivate(context: ExecutionContext): Promise<boolean> {
         const req = this.getRequest(context);
        let headers = req.headers ;
        let token ='rVXrfhBHDsANZV#(X^gYV*5/fG8,%96vohFvVILwyo6UFwxjj9U5j7xv5ZpwEA';
        console.log('The request headers  >>',JSON.stringify(headers));
        if(headers['apikey'] === token){
            console.log('Token found');
            return true;
        }else{
            console.log('UnAuthorized Admin endpoint call');
            throw new NotFoundException('Invalid Request Admin Request');
        }
    }
}
