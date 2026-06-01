import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { Order } from "../models/types.js";
import { orderRepo } from "../repositories/store.js";
import { appToSalesforceSyncService } from "../services/appToSalesforceSyncService.js";
import { eventBus } from "../services/eventBus.js";

const schema = z.object({
  orderNumber: z.string().min(1, "Order number is required."),
  customerEmail: z.string().email("A valid customer email is required."),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater."),
  status: z.string().min(1, "Status is required.")
});

export const orderRoutes = Router();

orderRoutes.get("/", async (_req, res, next) => {
  try {
    res.json(await orderRepo.read());
  } catch (error) {
    next(error);
  }
});

orderRoutes.post("/", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const now = new Date().toISOString();
    const order: Order = {
      id: uuid(),
      salesforceOrderId: "",
      ...payload,
      syncStatus: "Syncing",
      lastModified: now,
      createdAt: now,
      updatedAt: now
    };
    const orders = await orderRepo.read();
    await orderRepo.write([order, ...orders]);
    eventBus.emit("data-change", { entity: "Order" });
    void appToSalesforceSyncService.syncOrder(order, "CREATE");
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

orderRoutes.put("/:id", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const orders = await orderRepo.read();
    const existing = orders.find((item) => item.id === req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found." });
    const now = new Date().toISOString();
    const updated: Order = { ...existing, ...payload, syncStatus: "Syncing", lastModified: now, updatedAt: now };
    await orderRepo.write(orders.map((item) => (item.id === updated.id ? updated : item)));
    eventBus.emit("data-change", { entity: "Order" });
    void appToSalesforceSyncService.syncOrder(updated, "UPDATE");
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

orderRoutes.delete("/:id", async (req, res, next) => {
  try {
    const orders = await orderRepo.read();
    const existing = orders.find((item) => item.id === req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found." });
    await orderRepo.write(orders.filter((item) => item.id !== req.params.id));
    eventBus.emit("data-change", { entity: "Order" });
    void appToSalesforceSyncService.deleteSalesforceRecord("Order", existing.id, existing.salesforceOrderId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
