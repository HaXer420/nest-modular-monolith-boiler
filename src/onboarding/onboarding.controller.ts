import { Body, Controller, Patch, Res } from "@nestjs/common";
import { Response } from "express";
import { GetFullUser } from "src/common/decorators/get-full-user.decorator";
import { Roles } from "src/common/decorators/role.decorator";
import { UserRoleEnum } from "src/common/helpers/enums";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { User } from "src/user/entities/user.entity";
import { SetupProfileDto } from "./dto/setup-profile.dto";
import { OnboardingService } from "./onboarding.service";
import { OnboardingTag, SetupProfileSwagger } from "./onboarding.swagger";

@OnboardingTag()
@Controller({ version: "1", path: "onboarding" })
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly responseHandler: ResponseHandler,
  ) {}

  @Patch("setup-profile")
  @Roles(UserRoleEnum.USER)
  @SetupProfileSwagger()
  async setupProfile(
    @GetFullUser() user: User,
    @Body() setupProfileDto: SetupProfileDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.onboardingService.setupProfile(
        user,
        setupProfileDto,
      );
      if (result.success) {
        return this.responseHandler.successResponseWithDataAndAction(
          res,
          result.message,
          result.data,
          result.action,
        );
      }
      return this.responseHandler.errorResponse(res, result.message);
    } catch (error) {
      return this.responseHandler.catchErrorResponse(res, error.message);
    }
  }
}
