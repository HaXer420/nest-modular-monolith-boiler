import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "./common/helpers/jwt.service";
import { UploadService } from "./common/helpers/aws.service";
import { AuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/role.guard";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ResponseHandler } from "./common/helpers/response-handler";
import { UserModule } from "./user/user.module";
import { OnboardingModule } from "./onboarding/onboarding.module";

@Module({
  imports: [
    // config module
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get("DATABASE_URI");
        return { uri };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: "burst",
        ttl: 1000,
        limit: 15,
        blockDuration: 30000, // 30 seconds
      },
      {
        name: "standard",
        ttl: 60000, //60 seconds
        limit: 60,
        blockDuration: 120000, // 2 minutes
      },
      {
        name: "long-term",
        ttl: 3600000, // 1 hour
        limit: 1000,
        blockDuration: 86400000, // 24 hours
      },
    ]),
    UserModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    ResponseHandler,
    UploadService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
