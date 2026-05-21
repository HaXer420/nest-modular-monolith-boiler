import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  public async sign(payload: object, expireTime?: string): Promise<string> {
    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    if (!expireTime) {
      return jwt.sign(payload, secret);   // no expiresIn = never expires
    }

    return jwt.sign(payload, secret, {
      expiresIn: expireTime,
    });
  }

  public async verify(token: string): Promise<any> {
    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.verify(token, secret);
  }
}
