# NestJS Modular Monolith Boiler

A practical NestJS modular monolith starter with authentication, user management, onboarding, Swagger documentation, MongoDB persistence, refresh-token rotation, role guards, rate limiting, file upload helpers, and optional Firebase/S3 integrations.

This boilerplate is meant to be copied, studied, changed, and shipped. It keeps the application in one deployable NestJS codebase while separating features into clear modules. For most new products, that is the right starting point: one runtime, clear module boundaries, and fewer moving parts.

## Contents

- [What You Get](#what-you-get)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Setup](#setup)
- [Environment](#environment)
- [Run The API](#run-the-api)
- [Swagger Docs](#swagger-docs)
- [API Versioning](#api-versioning)
- [Auth Overview](#auth-overview)
- [Access And Refresh Tokens](#access-and-refresh-tokens)
- [User Actions](#user-actions)
- [Routes](#routes)
- [Security Notes](#security-notes)
- [Optional Integrations](#optional-integrations)
- [Testing](#testing)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [License](#license)

## What You Get

- Email or phone-number signup.
- Password login.
- Admin login.
- OTP verification.
- Forgot-password and reset-password flow.
- Firebase-backed social auth for Google and Apple.
- JWT access tokens.
- Device-bound refresh tokens.
- Refresh-token hashing before storage.
- Refresh-token rotation.
- Per-device logout by revoking the stored session.
- User profile setup flow.
- User profile details endpoint.
- Soft delete for the current user.
- Role-based access control.
- Global authentication guard.
- Global role guard.
- Global rate limiting with `@nestjs/throttler`.
- Request validation using `class-validator` and `class-transformer`.
- Swagger docs with bearer auth support.
- MongoDB schemas through Mongoose.
- Optional AWS S3 upload helper.
- Optional Firebase Admin helper.
- Consistent response helper.

## Tech Stack

- Node.js
- NestJS 11
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Swagger / OpenAPI
- Helmet
- Nest throttler
- Nodemailer
- Firebase Admin
- AWS SDK for S3
- Jest

## Project Structure

```text
src/
  auth/
    dto/
    entities/
    mappers/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    auth.swagger.ts

  user/
    dto/
    entities/
    mappers/
    user.controller.ts
    user.module.ts
    user.service.ts
    user.swagger.ts

  onboarding/
    dto/
    onboarding.controller.ts
    onboarding.module.ts
    onboarding.service.ts
    onboarding.swagger.ts

  common/
    decorators/
    filters/
    guards/
    helpers/
    interceptors/

  app.controller.ts
  app.module.ts
  app.service.ts
  app.swagger.ts
  main.ts

test/
  app.e2e-spec.ts
  jest-e2e.json
```

The app is split by feature modules:

- `auth` owns login, signup, OTP, sessions, refresh tokens, and social auth.
- `user` owns current-user profile reads and soft deletion.
- `onboarding` owns first profile setup.
- `common` owns guards, decorators, helper services, response formatting, security helpers, and shared enums.

## Requirements

Install these before starting:

- Node.js 20 or newer
- npm
- MongoDB, either local or hosted

Check your versions:

```bash
node -v
npm -v
```

## Setup

Clone the repository:

```bash
git clone <your-repo-url>
cd nest-monolith-boiler
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .example.env .env
```

On Windows PowerShell:

```powershell
Copy-Item .example.env .env
```

Edit `.env` and set at least:

```env
PORT=4700
NODE_ENV=local
DATABASE_URI=mongodb://127.0.0.1:27017/nest-monolith-boiler
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SWAGGER_ENABLE=true
```

Start MongoDB, then run the API.

## Environment

The full template lives in `.example.env`.

### Required For Core API

| Variable                 | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `PORT`                   | HTTP port. Defaults to `4700` if missing.                                 |
| `NODE_ENV`               | Environment name. Use `local`, `development`, or `production`.            |
| `DATABASE_URI`           | MongoDB connection string.                                                |
| `JWT_SECRET`             | Secret used to sign and verify JWTs. Use a long random value.             |
| `JWT_ACCESS_EXPIRES_IN`  | Access-token lifetime. Example: `15m`.                                    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime. Example: `7d`.                                    |
| `SWAGGER_ENABLE`         | Set `true` to expose Swagger docs.                                        |
| `CORS_ALLOWED_ORIGINS`   | Comma-separated allowed origins. Use specific origins outside local work. |

### Optional Email

| Variable             | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `GMAIL_USER`         | Gmail account used for transactional email. |
| `GMAIL_APP_PASSWORD` | Gmail app password.                         |
| `GMAIL_SENDER_NAME`  | Display name for outgoing email.            |

Email is used for OTP and password-reset emails. If email is not configured, the email service logs a warning and returns `false` instead of crashing the app.

### Optional Firebase

Firebase is used for social auth token verification and push notification helpers.

| Variable                      | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `TYPE`                        | Firebase service-account type.                                 |
| `PROJECT_ID`                  | Firebase project id.                                           |
| `PRIVATE_KEY_ID`              | Firebase private key id.                                       |
| `PRIVATE_KEY`                 | Firebase private key. Keep escaped newlines as `\n` in `.env`. |
| `CLIENT_EMAIL`                | Firebase service-account email.                                |
| `CLIENT_ID`                   | Firebase client id.                                            |
| `AUTH_URI`                    | Firebase auth URI.                                             |
| `TOKEN_URI`                   | Firebase token URI.                                            |
| `AUTH_PROVIDER_X509_CERT_URL` | Firebase cert URL.                                             |
| `CLIENT_X509_CERT_URL`        | Firebase client cert URL.                                      |
| `UNIVERSE_DOMAIN`             | Firebase universe domain.                                      |
| `GOOGLE_CLIENT_ID`            | Google client id, if your client app needs it.                 |

If Firebase is not configured, the app still boots. Firebase-backed routes fail clearly when used.

### Optional AWS S3

S3 is used by the upload helper.

| Variable                | Purpose                    |
| ----------------------- | -------------------------- |
| `AWS_REGION`            | S3 bucket region.          |
| `AWS_ACCESS_KEY_ID`     | AWS access key.            |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key.            |
| `AWS_BUCKET_NAME`       | S3 bucket name.            |
| `AWS_BUCKET_BASE_URL`   | Public base URL for files. |

If S3 is not configured, the app still boots. Upload endpoints return a service-unavailable response when used.

### Optional Twilio

Twilio helper support is included for phone OTP delivery.

| Variable                        | Purpose                        |
| ------------------------------- | ------------------------------ |
| `TWILIO_ACCOUNT_SID`            | Twilio account SID.            |
| `TWILIO_AUTH_TOKEN`             | Twilio auth token.             |
| `TWILIO_ALPHANUMERIC_SENDER_ID` | Sender id, if used.            |
| `TWILIO_MESSAGE_SERVICE_ID`     | Messaging service id, if used. |

## Run The API

Development mode with reload:

```bash
npm run start:dev
```

Production-style local run:

```bash
npm run build
npm run start:prod
```

Debug mode:

```bash
npm run start:debug
```

By default the API listens on:

```text
http://localhost:4700
```

Health check:

```text
GET /v1/health-check
```

## Swagger Docs

Set this in `.env`:

```env
SWAGGER_ENABLE=true
```

Start the server and open:

```text
http://localhost:4700/docs
```

The raw OpenAPI JSON is available at:

```text
http://localhost:4700/docs/json
```

Swagger includes bearer-token support. After login, copy the `accessToken`, click **Authorize**, and enter:

```text
Bearer <accessToken>
```

Most protected routes require this bearer access token.

## API Versioning

URI versioning is enabled in `main.ts`.

Routes are exposed under `/v1`, for example:

```text
POST /v1/auth/signup
POST /v1/auth/signin
GET  /v1/user/profile-details
```

## Auth Overview

The auth module supports these flows:

- Signup with email or phone number.
- OTP verification after signup.
- Signin with password.
- Admin signin.
- Social auth through Firebase verified Google or Apple tokens.
- Forgot-password OTP.
- Reset password with OTP.
- Access-token refresh with refresh-token rotation.
- Logout by revoking the current device session.

### Signup

Endpoint:

```text
POST /v1/auth/signup
```

The user signs up with:

- `email` or `number`
- `password`
- `role`

Only `user` is accepted for public signup. Admin users should be created by your own admin seed or internal process.

After signup:

- Password is hashed with bcrypt.
- User is stored in MongoDB.
- Signup type is saved as `email` or `number`.
- OTP is created for email or phone verification.
- The response includes an `action` value, usually `unverified`.

### OTP Verification

Endpoint:

```text
POST /v1/auth/verify-otp
```

The OTP flow:

- OTPs are stored against the user.
- OTPs are marked as used after successful verification.
- Verification sets `isEmailVerified` or `isNumberVerified`.
- A successful verification creates an access token and refresh token for the submitted device.

### Signin

Endpoint:

```text
POST /v1/auth/signin
```

The signin flow:

- Finds the user by email or phone number.
- Verifies the submitted password using bcrypt.
- Rejects deleted or blocked users.
- If the account is unverified, creates a new verification OTP and returns `action: "unverified"`.
- If the account is valid, returns user data, `action`, `accessToken`, and `refreshToken`.
- Stores the refresh-token session for the submitted device.

### Admin Signin

Endpoint:

```text
POST /v1/auth/admin-login
```

Admin login is separate from normal user login. It requires:

- admin email
- password
- device info

The service only looks for users with `role: "admin"`.

### Social Auth

Endpoint:

```text
POST /v1/auth/social-auth
```

Social auth uses Firebase Admin:

- The client sends a Firebase ID token.
- The backend verifies the token with Firebase Admin.
- The backend checks that the Firebase provider matches the requested provider.
- The backend requires an email from the provider.
- If the user does not exist, it creates a user account.
- The user receives normal access and refresh tokens.

Supported provider types:

- `google`
- `apple`

## Access And Refresh Tokens

This boilerplate uses short-lived access tokens and longer-lived refresh tokens.

### Access Token

Access tokens contain:

- `sub`: user id
- `role`: user role
- `tokenType`: `access`

Default lifetime:

```env
JWT_ACCESS_EXPIRES_IN=15m
```

Access tokens are sent in the Authorization header:

```text
Authorization: Bearer <accessToken>
```

The global auth guard rejects:

- missing tokens on protected routes
- invalid tokens
- tokens with the wrong `tokenType`
- deleted users
- blocked users

### Refresh Token

Refresh tokens contain:

- `sub`: user id
- `role`: user role
- `deviceId`: device id from the request body
- `jti`: random token id
- `tokenType`: `refresh`

Default lifetime:

```env
JWT_REFRESH_EXPIRES_IN=7d
```

Refresh tokens are not stored as plain text. The backend:

1. Hashes the refresh token with SHA-256.
2. Hashes that digest again with bcrypt.
3. Stores only the bcrypt hash in the `AuthSession` collection.

### Refresh Rotation

Endpoint:

```text
POST /v1/auth/refresh-token
```

The refresh flow:

1. Client sends the current refresh token and device info.
2. Backend verifies the JWT signature and expiry.
3. Backend checks `tokenType === "refresh"`.
4. Backend checks the token `deviceId` matches the submitted device id.
5. Backend finds the active session for that user and device.
6. Backend rejects revoked or expired sessions.
7. Backend compares the submitted refresh token with the stored hash.
8. Backend creates a new access token.
9. Backend creates a new refresh token.
10. Backend replaces the stored refresh-token hash.

That means every successful refresh rotates the refresh token. The previous refresh token stops being useful after rotation.

### Logout

Endpoint:

```text
POST /v1/auth/logout
```

Logout revokes the refresh session for the submitted device by setting `revokedAt`.

This is a per-device logout. If the same user has multiple devices, logging out one device does not automatically revoke the others.

## User Actions

Many auth responses include an `action` field. This tells the client what screen or step should happen next.

Current actions:

| Action              | Meaning                                                   |
| ------------------- | --------------------------------------------------------- |
| `unverified`        | The user still needs email or phone verification.         |
| `incompleteProfile` | The user is verified but has not completed profile setup. |
| `loginGranted`      | The user can continue into the app.                       |
| `blocked`           | The user is blocked.                                      |

The action is calculated from the user record:

- Admins must have verified email.
- Normal users must not be blocked.
- Normal users must verify email or phone.
- Normal users must complete profile setup.

Use `GET /v1/auth/action-check` to ask the backend for the current action for the authenticated user.

## Routes

### Auth

| Method | Route                                 | Access         | Purpose                                                                           |
| ------ | ------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| `POST` | `/v1/auth/signup`                     | Public         | Create a user account.                                                            |
| `POST` | `/v1/auth/signin`                     | Public         | Password login.                                                                   |
| `POST` | `/v1/auth/test-login`                 | Local/dev only | Testing route that returns a non-expiring access token. Do not use in production. |
| `POST` | `/v1/auth/refresh-token`              | Public         | Rotate refresh token and issue a new access token.                                |
| `POST` | `/v1/auth/logout`                     | Bearer token   | Revoke current device refresh session.                                            |
| `POST` | `/v1/auth/send-otp`                   | Public         | Send an OTP for a supported purpose.                                              |
| `POST` | `/v1/auth/verify-otp`                 | Public         | Verify signup/login OTP and create tokens.                                        |
| `POST` | `/v1/auth/forgot-password`            | Public         | Send password-reset OTP.                                                          |
| `POST` | `/v1/auth/verify-forgot-password-otp` | Public         | Check password-reset OTP.                                                         |
| `POST` | `/v1/auth/reset-password`             | Public         | Reset password with OTP.                                                          |
| `POST` | `/v1/auth/admin-login`                | Public         | Admin password login.                                                             |
| `POST` | `/v1/auth/social-auth`                | Public         | Google/Apple auth through Firebase token verification.                            |
| `GET`  | `/v1/auth/action-check`               | Bearer token   | Get current user action.                                                          |

### User

| Method   | Route                      | Access       | Purpose                   |
| -------- | -------------------------- | ------------ | ------------------------- |
| `GET`    | `/v1/user/profile-details` | Bearer token | Get current user profile. |
| `DELETE` | `/v1/user/me`              | Bearer token | Soft delete current user. |

### Onboarding

| Method  | Route                          | Access    | Purpose                                                              |
| ------- | ------------------------------ | --------- | -------------------------------------------------------------------- |
| `PATCH` | `/v1/onboarding/setup-profile` | User role | Set profile image, first name, last name, and optional phone number. |

### Utility

| Method   | Route               | Access       | Purpose                                   |
| -------- | ------------------- | ------------ | ----------------------------------------- |
| `GET`    | `/v1/health-check`  | Public       | Basic health check.                       |
| `PUT`    | `/v1/upload-media`  | Bearer token | Upload user media to S3.                  |
| `DELETE` | `/v1/delete-media`  | Bearer token | Delete current user's own uploaded media. |
| `POST`   | `/v1/backup/upload` | Admin role   | Upload a backup JSON file to S3.          |

## Security Notes

This boilerplate includes real security decisions, not just demo auth.

### Passwords

- Passwords are never stored as plain text.
- Passwords are hashed with bcrypt.
- Minimum password length is enforced through DTO validation.

### Tokens

- Access tokens are short-lived.
- Refresh tokens are device-bound.
- Refresh tokens are rotated after every refresh.
- Refresh tokens are hashed before storage.
- Refresh sessions can be revoked.
- Access and refresh tokens use a `tokenType` claim so they cannot be swapped accidentally.

### Guards

Global guards are registered in `AppModule`:

- `ThrottlerGuard`
- `AuthGuard`
- `RolesGuard`

Use `@Public()` only for routes that must not require authentication.

Use `@Roles(UserRoleEnum.ADMIN)` or `@Roles(UserRoleEnum.USER)` for role-specific routes.

Use `@GetFullUser()` to inject the authenticated user into a controller method.

### Validation

The global validation pipe:

- strips unknown fields
- rejects unknown fields
- transforms request bodies into DTO types
- stops on the first validation error

This keeps request payloads strict and predictable.

### Rate Limiting

Rate limiting is enabled globally with three windows:

| Window    | Limit                | Block duration |
| --------- | -------------------- | -------------- |
| Burst     | 15 requests / second | 30 seconds     |
| Standard  | 60 requests / minute | 2 minutes      |
| Long term | 1000 requests / hour | 24 hours       |

Adjust these in `src/app.module.ts` for your product.

### CORS

For local work, `CORS_ALLOWED_ORIGINS=*` is convenient.

For real environments, use explicit origins:

```env
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

### Swagger

Swagger is useful during development, but you can turn it off:

```env
SWAGGER_ENABLE=false
```

## Optional Integrations

The app can run without AWS S3 and Firebase configured. That is intentional. A fresh clone should be able to start with only MongoDB and JWT config.

### Email

Email OTP delivery uses Gmail SMTP through Nodemailer. For production, you may want to replace this with SES, Postmark, Resend, Mailgun, or another transactional email provider.

### Firebase

Firebase Admin is used for:

- verifying social auth ID tokens
- notification helper methods

The app logs a warning if Firebase is not configured. Social auth will not work until Firebase env vars are provided.

### S3

The upload helper stores files in S3. User media is written under:

```text
<userId>/media/<fileName>
```

Deletion is restricted to the current user's own media prefix.

## Testing

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run coverage:

```bash
npm run test:cov
```

Run e2e tests:

```bash
npm run test:e2e
```

Build the project:

```bash
npm run build
```

## Scripts

| Script                | Purpose                            |
| --------------------- | ---------------------------------- |
| `npm run start`       | Start Nest normally.               |
| `npm run start:dev`   | Start with hot reload.             |
| `npm run start:debug` | Start with debugger enabled.       |
| `npm run build`       | Compile TypeScript to `dist`.      |
| `npm run start:prod`  | Run compiled app from `dist/main`. |
| `npm run format`      | Format source and test files.      |
| `npm run lint`        | Run ESLint with auto-fix.          |
| `npm test`            | Run unit tests.                    |
| `npm run test:e2e`    | Run e2e tests.                     |
| `npm run test:cov`    | Run test coverage.                 |

## Deployment

For the full deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Common First Changes

When you use this boilerplate for a real project, you will probably change:

- package name in `package.json`
- Swagger title in `src/main.ts`
- email sender name in `.env`
- MongoDB database name
- action rules in `src/common/helpers/action.helper.ts`
- user profile fields in `src/user/entities/user.entity.ts`
- onboarding DTO in `src/onboarding/dto/setup-profile.dto.ts`
- rate limits in `src/app.module.ts`
- CORS origins in `.env`

## License

MIT
