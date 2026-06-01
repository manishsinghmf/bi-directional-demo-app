import { v4 as uuid } from "uuid";
import { contactToCustomer } from "../mappers/customerMapper.js";
import { salesforceToOrder } from "../mappers/orderMapper.js";
import { Customer, LiveCdcEvent, Order } from "../models/types.js";
import { customerRepo, liveEvents, orderRepo } from "../repositories/store.js";
import { eventBus } from "./eventBus.js";
import { logSyncEvent } from "./syncLogger.js";
import { withSalesforce } from "./salesforceClient.js";
import { salesforceAuthService } from "./salesforceAuthService.js";
import { appToSalesforceSyncService } from "./appToSalesforceSyncService.js";

export class SalesforceEventListener {
  private started = false;

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    try {
      const conn = await salesforceAuthService.getConnection();
      this.subscribe(conn, "/data/ContactChangeEvent", "Contact");
      this.subscribe(conn, "/data/Order__ChangeEvent", "Order__c");
    } catch (error) {
      this.started = false;
      console.warn("Salesforce CDC listener is idle:", error instanceof Error ? error.message : error);
    }
  }

  private subscribe(conn: any, channel: string, objectName: "Contact" | "Order__c"): void {
    conn.streaming.topic(channel).subscribe(async (message: any) => {
      const header = message?.payload?.ChangeEventHeader;
      const recordId = header?.recordIds?.[0] ?? "";
      const changeType = header?.changeType ?? "UNKNOWN";
      const event: LiveCdcEvent = {
        id: uuid(),
        eventTime: new Date().toISOString(),
        eventType: channel,
        object: objectName,
        recordId,
        changeType
      };
      liveEvents.unshift(event);
      liveEvents.splice(100);
      eventBus.emit("cdc-event", event);

      if (!recordId || !["CREATE", "UPDATE", "UNDELETE"].includes(changeType)) return;
      if (objectName === "Contact") await this.applyContactChange(recordId, changeType === "CREATE" ? "CREATE" : "UPDATE");
      if (objectName === "Order__c") await this.applyOrderChange(recordId, changeType === "CREATE" ? "CREATE" : "UPDATE");
    });
  }

  private async applyContactChange(recordId: string, operation: "CREATE" | "UPDATE"): Promise<void> {
    try {
      const record = await withSalesforce((conn) =>
        conn.sobject("Contact").retrieve(recordId, {
          fields: ["Id", "FirstName", "LastName", "Email", "Phone", "LastModifiedDate"]
        } as any)
      );
      const customers = await customerRepo.read();
      const existing = customers.find((item) => item.salesforceContactId === recordId || item.email === (record as any).Email);
      const sfModified = new Date((record as any).LastModifiedDate).getTime();
      const localModified = existing ? new Date(existing.lastModified).getTime() : 0;

      if (existing && localModified > sfModified) {
        await this.markCustomerConflict(existing);
        await appToSalesforceSyncService.syncCustomer(existing, "UPDATE");
        return;
      }

      const mapped = contactToCustomer(record, existing);
      await customerRepo.write(existing ? customers.map((item) => (item.id === existing.id ? mapped : item)) : [mapped, ...customers]);
      await logSyncEvent({
        entityType: "Customer",
        entityId: mapped.id,
        direction: "SALESFORCE_TO_APP",
        operation,
        status: "SUCCESS",
        message: "Applied Salesforce Contact CDC change locally."
      });
      eventBus.emit("data-change", { entity: "Customer" });
    } catch (error: any) {
      await logSyncEvent({
        entityType: "Customer",
        entityId: recordId,
        direction: "SALESFORCE_TO_APP",
        operation,
        status: "FAILED",
        message: error.message ?? "Failed to apply Contact CDC event."
      });
    }
  }

  private async applyOrderChange(recordId: string, operation: "CREATE" | "UPDATE"): Promise<void> {
    try {
      const record = await withSalesforce((conn) =>
        conn.sobject("Order__c").retrieve(recordId, {
          fields: ["Id", "Order_Number__c", "Amount__c", "Status__c", "Customer_Email__c", "LastModifiedDate"]
        } as any)
      );
      const orders = await orderRepo.read();
      const existing = orders.find((item) => item.salesforceOrderId === recordId || item.orderNumber === (record as any).Order_Number__c);
      const sfModified = new Date((record as any).LastModifiedDate).getTime();
      const localModified = existing ? new Date(existing.lastModified).getTime() : 0;

      if (existing && localModified > sfModified) {
        await this.markOrderConflict(existing);
        await appToSalesforceSyncService.syncOrder(existing, "UPDATE");
        return;
      }

      const mapped = salesforceToOrder(record, existing);
      await orderRepo.write(existing ? orders.map((item) => (item.id === existing.id ? mapped : item)) : [mapped, ...orders]);
      await logSyncEvent({
        entityType: "Order",
        entityId: mapped.id,
        direction: "SALESFORCE_TO_APP",
        operation,
        status: "SUCCESS",
        message: "Applied Salesforce Order__c CDC change locally."
      });
      eventBus.emit("data-change", { entity: "Order" });
    } catch (error: any) {
      await logSyncEvent({
        entityType: "Order",
        entityId: recordId,
        direction: "SALESFORCE_TO_APP",
        operation,
        status: "FAILED",
        message: error.message ?? "Failed to apply Order__c CDC event."
      });
    }
  }

  private async markCustomerConflict(customer: Customer): Promise<void> {
    const customers = await customerRepo.read();
    await customerRepo.write(customers.map((item) => (item.id === customer.id ? { ...item, syncStatus: "Conflict" } : item)));
    await logSyncEvent({
      entityType: "Customer",
      entityId: customer.id,
      direction: "SALESFORCE_TO_APP",
      operation: "UPDATE",
      status: "CONFLICT",
      message: "Conflict detected. Local customer was newer, so Salesforce will be updated."
    });
  }

  private async markOrderConflict(order: Order): Promise<void> {
    const orders = await orderRepo.read();
    await orderRepo.write(orders.map((item) => (item.id === order.id ? { ...item, syncStatus: "Conflict" } : item)));
    await logSyncEvent({
      entityType: "Order",
      entityId: order.id,
      direction: "SALESFORCE_TO_APP",
      operation: "UPDATE",
      status: "CONFLICT",
      message: "Conflict detected. Local order was newer, so Salesforce will be updated."
    });
  }
}

export const salesforceEventListener = new SalesforceEventListener();
