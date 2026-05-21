import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as twilio from "twilio";
@Injectable()
export class TwillioService {
  private client: twilio.Twilio;
  private readonly logger = new Logger(TwillioService.name);
  constructor(private configService: ConfigService) {
    this.client = twilio(
      this.configService.get<string>("TWILIO_ACCOUNT_SID"),
      this.configService.get<string>("TWILIO_AUTH_TOKEN"),
    );
  }

  async sendPhoneOtp(
    phoneNumber: string,
    countryCode: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const to = `${countryCode}${phoneNumber}`;

      const message = `Your verification code is: ${otp}. This code expires in 10 minutes.`;
      const messagingServiceSid = this.configService.get<string>(
        "TWILIO_MESSAGE_SERVICE_ID",
      );

      console.log("=======to=======> ", to);
      console.log("=======message=======> ", message);
      console.log("=======messagingServiceSid=======> ", messagingServiceSid);

      const response = await this.client.messages.create({
        body: message,
        // from: process.env.TWILIO_ALPHANUMERIC_SENDER_ID,
        messagingServiceSid: messagingServiceSid,
        to: to,
      });

      this.logger.log(
        `OTP sent successfully: SID=${response.sid}, To=${to}, MessagingServiceSid=${messagingServiceSid}`,
      );
      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error?.message}`);
      return { success: false, message: "Failed to send OTP" };
    }
  }
}
