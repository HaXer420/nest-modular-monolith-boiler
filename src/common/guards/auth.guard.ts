import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { Model } from "mongoose";
import { JwtService } from "src/common/helpers/jwt.service";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      "isPublic",
      context.getHandler(),
    );
    const request: any = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // For public routes, optionally validate token if provided
    if (isPublic) {
      if (token) {
        try {
          const payload = await this.jwtService.verify(token);
          if (payload?.tokenType === "access") {
            const user = await this.userModel
              .findById(payload?.sub)
              .select("+isDeleted +isBlocked");

            request.user = user;
            if (
              user &&
              !user.isDeleted &&
              //!user.isRestricted &&
              !user.isBlocked
            ) {
              request.user = user;
            }
          }
        } catch (error) {
          // Silently fail for public routes - token is optional
          console.log(
            "Optional token validation failed on public route:",
            error.message,
          );
        }
      }
      return true;
    }

    // For protected routes, token is required
    if (!token) {
      throw new UnauthorizedException("No authentication token provided.");
    }

    try {
      const payload = await this.jwtService.verify(token);
      if (!payload || payload.tokenType !== "access") {
        throw new ForbiddenException("Invalid token payload.");
      }

      const user = await this.userModel
        .findById(payload?.sub)
        .select("+isDeleted +isBlocked");

      if (!user) {
        throw new ForbiddenException("User not found.");
      }

      if (user.isDeleted) {
        throw new ForbiddenException("Your account has been deleted.");
      }

      // // if (user.isRestricted) {
      // //   throw new ForbiddenException("Your account has been restricted. Please contact support.");
      // // }

      if (user.isBlocked) {
        throw new ForbiddenException(
          "Your account has been blocked. Please contact support.",
        );
      }

      request.user = user;
      return true;
    } catch (error) {
      console.log(error);
      throw new ForbiddenException(error.message);
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    return authHeader.split(" ")[1];
  }
}
