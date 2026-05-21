import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { messages } from "./message";

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  private db?: admin.firestore.Firestore;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (admin.apps.length > 0) {
        this.logger.log("Firebase already initialized, reusing instance");
        this.db = admin.firestore();
        return;
      }

      const serviceAccount = {
        type: this.configService.get<string>("TYPE"),
        project_id: this.configService.get<string>("PROJECT_ID"),
        private_key_id: this.configService.get<string>("PRIVATE_KEY_ID"),
        private_key: this.configService
          .get<string>("PRIVATE_KEY")
          ?.replace(/\\n/g, "\n"),
        client_email: this.configService.get<string>("CLIENT_EMAIL"),
        client_id: this.configService.get<string>("CLIENT_ID"),
        auth_uri: this.configService.get<string>("AUTH_URI"),
        token_uri: this.configService.get<string>("TOKEN_URI"),
        auth_provider_x509_cert_url: this.configService.get<string>(
          "AUTH_PROVIDER_X509_CERT_URL",
        ),
        client_x509_cert_url: this.configService.get<string>(
          "CLIENT_X509_CERT_URL",
        ),
      };

      if (
        !serviceAccount.project_id ||
        !serviceAccount.private_key ||
        !serviceAccount.client_email
      ) {
        this.logger.warn(
          "Firebase is not configured. Social auth and notifications will be unavailable.",
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });

      this.db = admin.firestore();
      this.logger.log("Firebase initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Firebase Admin SDK", error);
    }
  }

  private ensureInitialized(): void {
    if (!this.db || admin.apps.length === 0) {
      throw new ServiceUnavailableException(
        messages.FIREBASE_CREDENTIALS_MISSING,
      );
    }
  }

  /**
   * Expose initialized Firestore instance
   */
  public get firestore(): admin.firestore.Firestore {
    this.ensureInitialized();
    return this.db as admin.firestore.Firestore;
  }
  /**
   * Subscribe one or multiple device tokens to a topic (e.g. user_123)
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      this.ensureInitialized();
      await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.debug(
        `${messages.FIREBASE_SUBSCRIBED_TO_TOPIC}: ${tokens.length} - ${topic}`,
      );
    } catch (error) {
      this.logger.error(
        `${messages.FIREBASE_SUBSCRIBE_ERROR} ${topic}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      this.ensureInitialized();
      await admin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.debug(
        `${messages.FIREBASE_UNSUBSCRIBED_FROM_TOPIC}: ${tokens.length} - ${topic}`,
      );
    } catch (error) {
      this.logger.error(
        `${messages.FIREBASE_UNSUBSCRIBE_ERROR} ${topic}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const message: admin.messaging.Message = {
      data: { title, body },
      topic,
    };

    try {
      this.ensureInitialized();
      const response = await admin.messaging().send(message);
      this.logger.debug(
        `${messages.FIREBASE_NOTIFICATION_SENT_TO_TOPIC}: ${topic} (${response})`,
      );
    } catch (error) {
      this.logger.error(`${messages.FIREBASE_SEND_ERROR} ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Send data-only message to a topic (no notification title/body)
   */
  async sendDataToTopic(
    topic: string,
    data: Record<string, any>,
  ): Promise<void> {
    const stringData: Record<string, string> = Object.fromEntries(
      Object.entries(data || {}).map(([key, value]) => [key, String(value)]),
    );

    const message: admin.messaging.Message = {
      data: stringData,
      topic,
    };

    try {
      this.ensureInitialized();
      await admin.messaging().send(message);
      this.logger.debug(
        `${messages.FIREBASE_NOTIFICATION_SENT_TO_TOPIC}: ${topic}`,
      );
    } catch (error) {
      this.logger.error(`${messages.FIREBASE_SEND_ERROR} ${topic}:`, error);
      throw error;
    }
  }

  async verifySocialAuthToken(
    token: string,
  ): Promise<admin.auth.DecodedIdToken> {
    this.ensureInitialized();
    return admin.auth().verifyIdToken(token);
  }
}
