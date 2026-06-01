import jsforce from "jsforce";
import { env } from "../config/env.js";
import { connectionRepo } from "../repositories/store.js";
import { eventBus } from "./eventBus.js";

export class SalesforceAuthService {
  private oauth2 = new jsforce.OAuth2({
    loginUrl: env.salesforceLoginUrl,
    clientId: env.salesforceClientId,
    clientSecret: env.salesforceClientSecret,
    redirectUri: env.salesforceRedirectUri
  });

  getAuthorizationUrl(): string {
    return this.oauth2.getAuthorizationUrl({
      scope: "api refresh_token offline_access"
    });
  }

  async exchangeCode(code: string): Promise<void> {
    const conn = new jsforce.Connection({ oauth2: this.oauth2 });
    await conn.authorize(code);
    await connectionRepo.write({
      instanceUrl: conn.instanceUrl,
      accessToken: conn.accessToken ?? "",
      refreshToken: conn.refreshToken ?? "",
      expiresAt: this.defaultExpiresAt()
    });
    eventBus.emit("notification", { severity: "success", message: "Salesforce Connected" });
  }

  async disconnect(): Promise<void> {
    await connectionRepo.write({ instanceUrl: "", accessToken: "", refreshToken: "", expiresAt: "" });
  }

  async getConnection(forceRefresh = false): Promise<jsforce.Connection> {
    const stored = await connectionRepo.read();
    if (!stored.instanceUrl || !stored.refreshToken) {
      throw new Error("Salesforce is not connected. Use the Connect Salesforce button first.");
    }

    let accessToken = stored.accessToken;
    if (forceRefresh || this.isExpired(stored.expiresAt)) {
      accessToken = await this.refreshAccessToken();
    }

    return new jsforce.Connection({
      instanceUrl: stored.instanceUrl,
      accessToken,
      refreshToken: stored.refreshToken,
      oauth2: this.oauth2
    });
  }

  async getValidAccessToken(): Promise<string> {
    const conn = await this.getConnection();
    return conn.accessToken ?? "";
  }

  async refreshAccessToken(): Promise<string> {
    const stored = await connectionRepo.read();
    const conn = new jsforce.Connection({
      instanceUrl: stored.instanceUrl,
      refreshToken: stored.refreshToken,
      oauth2: this.oauth2
    });

    const tokenResponse = await conn.oauth2.refreshToken(stored.refreshToken);
    const accessToken = tokenResponse.access_token;

    await connectionRepo.write({
      ...stored,
      accessToken,
      expiresAt: this.defaultExpiresAt()
    });
    eventBus.emit("notification", { severity: "info", message: "Access Token Refreshed" });
    return accessToken;
  }

  private isExpired(expiresAt: string): boolean {
    if (!expiresAt) return true;
    return Date.now() > new Date(expiresAt).getTime() - 60_000;
  }

  private defaultExpiresAt(): string {
    return new Date(Date.now() + 110 * 60 * 1000).toISOString();
  }
}

export const salesforceAuthService = new SalesforceAuthService();
