import { Router } from "express";
import { connectionRepo, customerRepo, orderRepo, syncEventRepo } from "../repositories/store.js";

export const syncRoutes = Router();

syncRoutes.get("/events", async (_req, res, next) => {
  try {
    res.json(await syncEventRepo.read());
  } catch (error) {
    next(error);
  }
});

syncRoutes.get("/status", async (_req, res, next) => {
  try {
    const [customers, orders, events, connection] = await Promise.all([
      customerRepo.read(),
      orderRepo.read(),
      syncEventRepo.read(),
      connectionRepo.read()
    ]);
    res.json({
      totalCustomers: customers.length,
      totalOrders: orders.length,
      salesforceConnected: Boolean(connection.instanceUrl && connection.refreshToken),
      instanceUrl: connection.instanceUrl,
      lastSyncTime: events.find((event) => event.status === "SUCCESS")?.timestamp ?? "",
      syncSuccessCount: events.filter((event) => event.status === "SUCCESS").length,
      syncFailureCount: events.filter((event) => event.status === "FAILED").length
    });
  } catch (error) {
    next(error);
  }
});
