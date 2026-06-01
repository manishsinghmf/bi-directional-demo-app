import { Customer, LiveCdcEvent, Order, SalesforceAuthStatus, SyncEvent, SyncStatusSummary } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(body.message ?? "Request failed.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  loginUrl: `${API_BASE}/auth/salesforce/login`,
  customers: () => request<Customer[]>("/api/customers"),
  createCustomer: (payload: Partial<Customer>) => request<Customer>("/api/customers", { method: "POST", body: JSON.stringify(payload) }),
  updateCustomer: (id: string, payload: Partial<Customer>) =>
    request<Customer>(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCustomer: (id: string) => request<void>(`/api/customers/${id}`, { method: "DELETE" }),
  orders: () => request<Order[]>("/api/orders"),
  createOrder: (payload: Partial<Order>) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  updateOrder: (id: string, payload: Partial<Order>) => request<Order>(`/api/orders/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteOrder: (id: string) => request<void>(`/api/orders/${id}`, { method: "DELETE" }),
  syncEvents: () => request<SyncEvent[]>("/api/sync/events"),
  syncStatus: () => request<SyncStatusSummary>("/api/sync/status"),
  authStatus: () => request<SalesforceAuthStatus>("/auth/salesforce/status"),
  disconnect: () => request<{ ok: boolean }>("/auth/salesforce/disconnect", { method: "POST" }),
  liveEventsUrl: `${API_BASE}/api/events/live`
};
