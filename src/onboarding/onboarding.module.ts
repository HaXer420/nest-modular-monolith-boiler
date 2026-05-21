import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { User, UserSchema } from "src/user/entities/user.entity";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, ResponseHandler],
})
export class OnboardingModule {}
