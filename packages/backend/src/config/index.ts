import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  databaseUrl: parsed.data.DATABASE_URL,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  frontendUrl: parsed.data.FRONTEND_URL,
  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },
  twilio: {
    accountSid: parsed.data.TWILIO_ACCOUNT_SID,
    authToken: parsed.data.TWILIO_AUTH_TOKEN,
    phoneNumber: parsed.data.TWILIO_PHONE_NUMBER,
  },
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parseInt(parsed.data.SMTP_PORT || '587', 10),
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM || 'noreply@quickridergh.com',
  },
  google: {
    clientId: parsed.data.GOOGLE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
  },
  paystack: {
    secretKey: parsed.data.PAYSTACK_SECRET_KEY,
  },
  firebase: {
    serviceAccount: parsed.data.FIREBASE_SERVICE_ACCOUNT,
  },
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
};
