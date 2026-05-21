import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "src/common/decorators/role.decorator";
import { UserRoleEnum } from "src/common/helpers/enums";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // console.log("requiredRoles", requiredRoles)
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const isAuthorizedUser = requiredRoles.some((role) => {
      return user.role == role;
    });
    if (!isAuthorizedUser) {
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );
    } else {
      return true;
    }
  }
}
