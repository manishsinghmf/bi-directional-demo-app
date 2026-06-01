import { v4 as uuid } from "uuid";
import { SyncDirection, SyncEvent, SyncEventStatus, SyncOperation } from "../models/types.js";
import { syncEventRepo } from "../repositories/store.js";
import { eventBus } from "./eventBus.js";

export async function logSyncEvent(input: {
  entityType: "Customer" | "Order";
  entityId: string;
  direction: SyncDirection;
  operation: SyncOperation;
  status: SyncEventStatus;
  message: string;
}): Promise<SyncEvent> {
  const event: SyncEvent = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    ...input
  };
  const events = await syncEventRepo.read();
  events.unshift(event);
  await syncEventRepo.write(events.slice(0, 500));
  eventBus.emit("sync-event", event);
  if (event.status === "SUCCESS") eventBus.emit("notification", { severity: "success", message: "Sync Success" });
  if (event.status === "FAILED") eventBus.emit("notification", { severity: "error", message: "Sync Failed" });
  if (event.status === "CONFLICT") eventBus.emit("notification", { severity: "warning", message: "Conflict Detected" });
  return event;
}
