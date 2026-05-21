import { User } from "src/user/entities/user.entity";
import { ActionEnum, UserRoleEnum } from "./enums";

export function actionSwitches(user: User): ActionEnum {
  switch (user.role) {
    case UserRoleEnum.ADMIN:
      switch (true) {
        case !user.isEmailVerified:
          return ActionEnum.UNVERIFIED;
        default:
          return ActionEnum.LOGIN_GRANTED;
      }
    default:
      switch (true) {
        case user.isBlocked:
          return ActionEnum.BLOCKED;
        case !user.isEmailVerified && !user.isNumberVerified:
          return ActionEnum.UNVERIFIED;
        case !user.isProfileSetup:
          return ActionEnum.INCOMPLETE_PROFILE;
        default:
          return ActionEnum.LOGIN_GRANTED;
      }
  }
}
