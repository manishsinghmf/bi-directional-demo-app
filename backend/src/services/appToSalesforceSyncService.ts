import { Customer, Order } from "../models/types.js";
import { customerRepo, orderRepo } from "../repositories/store.js";
import { customerToContact } from "../mappers/customerMapper.js";
import { orderToSalesforce } from "../mappers/orderMapper.js";
import { withSalesforce } from "./salesforceClient.js";
import { logSyncEvent } from "./syncLogger.js";
import { eventBus } from "./eventBus.js";
import { SALESFORCE_OBJECTS } from "../config/salesforceSchema.js";

const escapeSoql = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export class AppToSalesforceSyncService {
  async syncCustomer(customer: Customer, operation: "CREATE" | "UPDATE" = "UPDATE"): Promise<void> {
    try {
      await logSyncEvent({
        entityType: "Customer",
        entityId: customer.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "SYNCING",
        message: "Sending customer to Salesforce."
      });

      const result = await withSalesforce(async (conn) => {
        let contactId = customer.salesforceContactId;
        if (!contactId && customer.email) {
          const found = await conn.query<{ Id: string; Email: string; LastModifiedDate: string }>(
            `SELECT Id, Email, LastModifiedDate FROM Contact WHERE Email = '${escapeSoql(customer.email)}' LIMIT 1`
          );
          contactId = found.records[0]?.Id ?? "";
        }

        if (contactId) {
          await conn.sobject("Contact").update({ Id: contactId, ...customerToContact(customer) });
          return { id: contactId, message: "Updated existing Salesforce Contact." };
        }

        const created = await conn.sobject("Contact").create(customerToContact(customer));
        if (!created.success) throw new Error(created.errors?.join(", ") || "Contact creation failed.");
        return { id: created.id, message: "Created Salesforce Contact." };
      });

      const customers = await customerRepo.read();
      const next = customers.map((item) =>
        item.id === customer.id
          ? {
              ...item,
              salesforceContactId: result.id,
              syncStatus: "Synced" as const,
              updatedAt: new Date().toISOString()
            }
          : item
      );
      await customerRepo.write(next);
      await logSyncEvent({
        entityType: "Customer",
        entityId: customer.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "SUCCESS",
        message: result.message
      });
      eventBus.emit("data-change", { entity: "Customer" });
    } catch (error: any) {
      await this.markCustomer(customer.id, "Failed");
      await logSyncEvent({
        entityType: "Customer",
        entityId: customer.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "FAILED",
        message: error.message ?? "Customer sync failed."
      });
    }
  }

  async syncOrder(order: Order, operation: "CREATE" | "UPDATE" = "UPDATE"): Promise<void> {
    try {
      await logSyncEvent({
        entityType: "Order",
        entityId: order.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "SYNCING",
        message: "Sending order to Salesforce."
      });

      const result = await withSalesforce(async (conn) => {
        if (order.salesforceOrderId) {
          await conn.sobject(SALESFORCE_OBJECTS.order).update({ Id: order.salesforceOrderId, ...orderToSalesforce(order) });
          return { id: order.salesforceOrderId, message: `Updated Salesforce ${SALESFORCE_OBJECTS.order}.` };
        }
        const created = await conn.sobject(SALESFORCE_OBJECTS.order).create(orderToSalesforce(order));
        if (!created.success) throw new Error(created.errors?.join(", ") || "Order creation failed.");
        return { id: created.id, message: `Created Salesforce ${SALESFORCE_OBJECTS.order}.` };
      });

      const orders = await orderRepo.read();
      await orderRepo.write(
        orders.map((item) =>
          item.id === order.id
            ? { ...item, salesforceOrderId: result.id, syncStatus: "Synced", updatedAt: new Date().toISOString() }
            : item
        )
      );
      await logSyncEvent({
        entityType: "Order",
        entityId: order.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "SUCCESS",
        message: result.message
      });
      eventBus.emit("data-change", { entity: "Order" });
    } catch (error: any) {
      await this.markOrder(order.id, "Failed");
      await logSyncEvent({
        entityType: "Order",
        entityId: order.id,
        direction: "APP_TO_SALESFORCE",
        operation,
        status: "FAILED",
        message: error.message ?? "Order sync failed."
      });
    }
  }

  async deleteSalesforceRecord(entity: "Customer" | "Order", localId: string, salesforceId: string): Promise<void> {
    if (!salesforceId) return;
    try {
      await withSalesforce((conn) =>
        conn.sobject(entity === "Customer" ? SALESFORCE_OBJECTS.contact : SALESFORCE_OBJECTS.order).destroy(salesforceId)
      );
      await logSyncEvent({
        entityType: entity,
        entityId: localId,
        direction: "APP_TO_SALESFORCE",
        operation: "DELETE",
        status: "SUCCESS",
        message: `Deleted ${entity} in Salesforce.`
      });
    } catch (error: any) {
      await logSyncEvent({
        entityType: entity,
        entityId: localId,
        direction: "APP_TO_SALESFORCE",
        operation: "DELETE",
        status: "FAILED",
        message: error.message ?? `Failed to delete ${entity} in Salesforce.`
      });
    }
  }

  private async markCustomer(id: string, syncStatus: Customer["syncStatus"]): Promise<void> {
    const customers = await customerRepo.read();
    await customerRepo.write(customers.map((customer) => (customer.id === id ? { ...customer, syncStatus } : customer)));
    eventBus.emit("data-change", { entity: "Customer" });
  }

  private async markOrder(id: string, syncStatus: Order["syncStatus"]): Promise<void> {
    const orders = await orderRepo.read();
    await orderRepo.write(orders.map((order) => (order.id === id ? { ...order, syncStatus } : order)));
    eventBus.emit("data-change", { entity: "Order" });
  }
}

export const appToSalesforceSyncService = new AppToSalesforceSyncService();
