import { Module } from "@nestjs/common";
import { verificationController } from "./controllers/verification.controller";
import { VerificationService } from "./services/verification.service";

@Module({
    imports: [],
    controllers: [verificationController],
    providers: [VerificationService]
})
export class OrchidModule {

}