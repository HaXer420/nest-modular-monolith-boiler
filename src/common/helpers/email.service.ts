import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class SendEmailService {
  private readonly logger = new Logger(SendEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getTransporter() {
    const user = this.configService.get<string>("GMAIL_USER");
    const pass = this.configService.get<string>("GMAIL_APP_PASSWORD");

    if (!user || !pass) {
      this.logger.warn(
        "GMAIL_USER or GMAIL_APP_PASSWORD is not configured. Email was not sent.",
      );
      return null;
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });
  }

  private getSender() {
    const email = this.configService.get<string>("GMAIL_USER");
    const name =
      this.configService.get<string>("GMAIL_SENDER_NAME") || "Nest-Boiler";
    return `"${name}" <${email}>`;
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.sendMail({
      from: this.getSender(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });
    return true;
  }

  async sendOtpToEmail(email: string, otp: number): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Your Nest-Boiler verification code",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Reset your Nest-Boiler password",
      text: `Your password reset OTP is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });
  }
}
