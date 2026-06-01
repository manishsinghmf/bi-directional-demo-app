import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { customerRoutes } from "./routes/customerRoutes.js";
import { eventRoutes } from "./routes/eventRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { syncRoutes } from "./routes/syncRoutes.js";
import { salesforceEventListener } from "./services/salesforceEventListener.js";

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/events", eventRoutes);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: error.errors[0]?.message ?? "Validation failed." });
  }
  console.error(error);
  res.status(error.status ?? 500).json({ message: error.message ?? "Unexpected server error." });
});

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
  void salesforceEventListener.start();
});
