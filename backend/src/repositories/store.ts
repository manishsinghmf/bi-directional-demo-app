import { Customer, LiveCdcEvent, Order, SalesforceConnection, SyncEvent } from "../models/types.js";
import { dataPath, JsonRepository } from "./jsonRepository.js";

export const customerRepo = new JsonRepository<Customer[]>(dataPath("customers.json"), []);
export const orderRepo = new JsonRepository<Order[]>(dataPath("orders.json"), []);
export const syncEventRepo = new JsonRepository<SyncEvent[]>(dataPath("sync-events.json"), []);
export const connectionRepo = new JsonRepository<SalesforceConnection>(dataPath("salesforce-connection.json"), {
  instanceUrl: "",
  accessToken: "",
  refreshToken: "",
  expiresAt: ""
});

export const liveEvents: LiveCdcEvent[] = [];
