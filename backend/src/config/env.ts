import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  salesforceClientId: process.env.SALESFORCE_CLIENT_ID ?? "",
  salesforceClientSecret: process.env.SALESFORCE_CLIENT_SECRET ?? "",
  salesforceRedirectUri:
    process.env.SALESFORCE_REDIRECT_URI ?? "http://localhost:4000/auth/salesforce/callback",
  salesforceLoginUrl: process.env.SALESFORCE_LOGIN_URL ?? "https://login.salesforce.com"
};
