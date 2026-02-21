export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string | { name: string; address: string };
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: {
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }[];
}

export interface SendPasswordEmailOptions {
  to: string;
  password: string;
  name?: string;
}

export interface SendResetEmailOptions {
  to: string;
  resetLink: string;
  name?: string;
}

export interface SendWelcomeEmailOptions {
  to: string;
  name?: string;
  loginUrl: string;
}

export interface SendNotificationOptions {
  to: string;
  subject: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}