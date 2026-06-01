export const SALESFORCE_OBJECTS = {
  contact: "Contact",
  order: "Order__c"
} as const;

export const SALESFORCE_CDC_CHANNELS = {
  contact: "/data/ContactChangeEvent",
  order: "/data/Order__ChangeEvent"
} as const;

export const SALESFORCE_ORDER_FIELDS = [
  "Id",
  "Order_Number__c",
  "Amount__c",
  "Status__c",
  "Customer_Email__c",
  "LastModifiedDate"
] as const;
