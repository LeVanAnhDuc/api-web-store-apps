export interface EmailSendOptions {
  to: string;
  subject: string;
  htmlContent: string;
}

export abstract class EmailTransport {
  protected isInitialized: boolean = false;

  abstract sendRawEmail(options: EmailSendOptions): Promise<void>;

  abstract initialize(): Promise<void>;

  abstract cleanup(): Promise<void>;

  abstract get isConnected(): boolean;
}
