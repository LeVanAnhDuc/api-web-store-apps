import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Logger } from "@/infra/utils/logger";
import config from "@/infra/configs/env";
import {
  EMAIL_SERVICE,
  EMAIL_POOL,
  EMAIL_RATE_LIMIT
} from "@/app/constants/email";
import type { EmailSendOptions } from "@/app/services/abstracts/EmailTransport";
import { EmailTransport } from "@/app/services/abstracts/EmailTransport";

export class NodemailerTransport extends EmailTransport {
  private static instance: NodemailerTransport | null = null;
  private transporter: Transporter | null = null;

  public static getInstance(): NodemailerTransport {
    if (!NodemailerTransport.instance) {
      NodemailerTransport.instance = new NodemailerTransport();
      NodemailerTransport.instance.initialize().catch((error) => {
        Logger.error("Failed to initialize email transport", error);
      });
    }
    return NodemailerTransport.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE.PROVIDER,
      auth: {
        user: config.USERNAME_EMAIL,
        pass: config.PASSWORD_EMAIL
      },
      pool: true,
      maxConnections: EMAIL_POOL.MAX_CONNECTIONS,
      maxMessages: EMAIL_POOL.MAX_MESSAGES_PER_CONNECTION,
      rateDelta: EMAIL_RATE_LIMIT.DELTA_MS,
      rateLimit: EMAIL_RATE_LIMIT.PER_SECOND
    });

    this.isInitialized = true;
  }

  async sendRawEmail(options: EmailSendOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error("Email transport not initialized");
    }

    await this.transporter.sendMail({
      from: config.USERNAME_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.htmlContent
    });
  }

  async cleanup(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.isInitialized = false;
    }
  }

  get isConnected(): boolean {
    return this.transporter !== null && this.isInitialized;
  }
}
