import { Router } from "express";
import { liveEvents } from "../repositories/store.js";
import { eventBus } from "../services/eventBus.js";

export const eventRoutes = Router();

eventRoutes.get("/live", (req, res) => {
  eventBus.addClient(res);
  res.write(`event: cdc-snapshot\ndata: ${JSON.stringify(liveEvents)}\n\n`);
});
