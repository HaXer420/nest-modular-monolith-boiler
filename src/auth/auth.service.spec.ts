import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { ResponseHandler } from "src/common/helpers/response-handler";
import { SendEmailService } from "src/common/helpers/email.service";
import { FirebaseService } from "src/common/helpers/firebase.service";
import { JwtService } from "src/common/helpers/jwt.service";
import { User } from "src/user/entities/user.entity";
import { AuthSession } from "./entities/auth-session.entity";
import { Otp } from "./entities/otp.entity";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(Otp.name),
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: getModelToken(AuthSession.name),
          useValue: {},
        },
        SendEmailService,
        ResponseHandler,
        JwtService,
        FirebaseService,
        ConfigService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
