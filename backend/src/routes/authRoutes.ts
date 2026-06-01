import { Router } from "express";
import { env } from "../config/env.js";
import { connectionRepo } from "../repositories/store.js";
import { salesforceAuthService } from "../services/salesforceAuthService.js";
import { salesforceEventListener } from "../services/salesforceEventListener.js";

export const authRoutes = Router();

authRoutes.get("/salesforce/login", (_req, res) => {
  res.redirect(salesforceAuthService.getAuthorizationUrl());
});

authRoutes.get("/salesforce/callback", async (req, res, next) => {
  try {
    const code = String(req.query.code ?? "");
    if (!code) throw new Error("Missing Salesforce authorization code.");
    await salesforceAuthService.exchangeCode(code);
    void salesforceEventListener.start();
    res.redirect(`${env.frontendUrl}/?connected=true`);
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/salesforce/disconnect", async (_req, res, next) => {
  try {
    await salesforceAuthService.disconnect();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRoutes.get("/salesforce/status", async (_req, res, next) => {
  try {
    const connection = await connectionRepo.read();
    res.json({
      connected: Boolean(connection.instanceUrl && connection.refreshToken),
      instanceUrl: connection.instanceUrl,
      expiresAt: connection.expiresAt
    });
  } catch (error) {
    next(error);
  }
});
