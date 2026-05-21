import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ExecutionTimeInterceptor } from "./common/interceptors/execution-time.interceptor";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as helmet from "helmet";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  // const moduleConfigurations: any = {
  //   cors: false,
  //   rawBody: true,
  // };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Get ConfigService
  const configService = app.get(ConfigService);
  const swaggerEnabled = configService.get<string>("SWAGGER_ENABLE") === "true";
  const helmetFactory = (helmet as any).default
    ? (helmet as any).default
    : (helmet as any);
  const appHelmet = helmetFactory();
  const swaggerHelmet = helmetFactory({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // SECURITY: keep strict Helmet defaults for the app while relaxing Swagger docs only.
  app.use((req, res, next) => {
    if (swaggerEnabled && req.path.startsWith("/docs")) {
      return swaggerHelmet(req, res, next);
    }
    return appHelmet(req, res, next);
  });

  // Verification Header: To prove security middleware is working
  app.use((req, res, next) => {
    res.setHeader("X-Security-Enhanced", "true");
    next();
  });

  const isLocal = process.env.NODE_ENV?.trim() === "local";
  const origins = configService.get<string>("CORS_ALLOWED_ORIGINS");
  const allowedOrigins = origins
    ? origins.split(",").map((o) => o.trim())
    : ["*"];
  console.log("allowedOrigins---  -- -- - -- - -- >", allowedOrigins);
  console.log("islocal--- ---- - ---- >", isLocal);
  app.enableCors({
    // On local: allow all origins so Swagger works from any IP/device on the network
    // On live: enforce strict allowlist from CORS_ALLOWED_ORIGINS env variable
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    // origin: ['https://ht3b8fb6-5173.inc1.devtunnels.ms'],
    credentials: true,
  });

  // Set up EJS view engine
  app.setBaseViewsDir(join(__dirname, "..", "views"));
  app.setViewEngine("ejs");

  // global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not defined in the DTO - SECURITY: prevents object injection
      forbidNonWhitelisted: true, // throw error on unknown properties - SECURITY: strict validation
      transform: true, // auto-transform payloads to DTO instances
      stopAtFirstError: true, // stop validation on first error
      exceptionFactory: (errors) => {
        const constraints = errors[0]?.constraints;
        const firstError = constraints
          ? Object.values(constraints)[0]
          : "Validation error";
        return new BadRequestException(firstError);
      },
    }),
  );

  app.useGlobalInterceptors(new ExecutionTimeInterceptor());

  // Activating Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  if (swaggerEnabled) {
    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle("Nest-Boiler API Documentation")
      .setDescription("Nest-Boiler API Description")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    // SwaggerModule.setup("docs", app, document, {
    //   swaggerOptions: { defaultModelsExpandDepth: -1, persistAuthorization: true },
    //   jsonDocumentUrl: "docs/json",
    // });

    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
        persistAuthorization: true,
        // 👇👇 ADDED: Enable syntax highlighting + better editor experience
        // (This uses Swagger UI's built-in Ace editor features)
        // syntaxHighlight: {
        //   activated: true,
        //   theme: "agate", // You can choose: "agate", "monokai", "obsidian"
        // },
        tryItOutEnabled: true, // Enable Try it out by default
        displayRequestDuration: true, // Show request duration in UI
        // jsonEditor: true, // 👈 ENABLES JSON EDITOR IN REQUEST BODY
      },
      jsonDocumentUrl: "docs/json",
      customSiteTitle: "Nest-Boiler API Docs", // small enhancement: custom title
    });

    // 👇👇 OPTIONAL: Add small JS script to auto-beautify JSON when typing
    // (Swagger UI supports Ace editor events, so this ensures nice formatting)
    // app.use("/docs", (req, res, next) => {
    //   res.setHeader("X-Frame-Options", "SAMEORIGIN");
    //   next();
    // });
  }

  // listening on port
  const port = configService.get<number>("PORT") || 4700;
  await app.listen(port, "0.0.0.0");

  swaggerEnabled
    ? logger.debug(`📚 Swagger Documentation at: http://localhost:${port}/docs`)
    : logger.debug("Swagger Documentation is disabled");
  logger.debug(`✅ Server is up and running at port: ${port} on 0.0.0.0`);
}
bootstrap();
