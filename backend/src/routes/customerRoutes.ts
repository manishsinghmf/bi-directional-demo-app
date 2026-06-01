import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { Customer } from "../models/types.js";
import { customerRepo } from "../repositories/store.js";
import { appToSalesforceSyncService } from "../services/appToSalesforceSyncService.js";
import { eventBus } from "../services/eventBus.js";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional().default("")
});

export const customerRoutes = Router();

customerRoutes.get("/", async (_req, res, next) => {
  try {
    res.json(await customerRepo.read());
  } catch (error) {
    next(error);
  }
});

customerRoutes.post("/", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const now = new Date().toISOString();
    const customer: Customer = {
      id: uuid(),
      salesforceContactId: "",
      ...payload,
      phone: payload.phone ?? "",
      syncStatus: "Syncing",
      lastModified: now,
      createdAt: now,
      updatedAt: now
    };
    const customers = await customerRepo.read();
    await customerRepo.write([customer, ...customers]);
    eventBus.emit("data-change", { entity: "Customer" });
    void appToSalesforceSyncService.syncCustomer(customer, "CREATE");
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

customerRoutes.put("/:id", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const customers = await customerRepo.read();
    const existing = customers.find((item) => item.id === req.params.id);
    if (!existing) return res.status(404).json({ message: "Customer not found." });
    const now = new Date().toISOString();
    const updated: Customer = { ...existing, ...payload, phone: payload.phone ?? "", syncStatus: "Syncing", lastModified: now, updatedAt: now };
    await customerRepo.write(customers.map((item) => (item.id === updated.id ? updated : item)));
    eventBus.emit("data-change", { entity: "Customer" });
    void appToSalesforceSyncService.syncCustomer(updated, "UPDATE");
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

customerRoutes.delete("/:id", async (req, res, next) => {
  try {
    const customers = await customerRepo.read();
    const existing = customers.find((item) => item.id === req.params.id);
    if (!existing) return res.status(404).json({ message: "Customer not found." });
    await customerRepo.write(customers.filter((item) => item.id !== req.params.id));
    eventBus.emit("data-change", { entity: "Customer" });
    void appToSalesforceSyncService.deleteSalesforceRecord("Customer", existing.id, existing.salesforceContactId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
