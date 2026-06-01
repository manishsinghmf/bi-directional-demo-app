# Learning Guide: Salesforce Bi-Directional Sync Demo

This project is a local full-stack prototype that shows automatic synchronization between a custom app and Salesforce.

## Project Layout

```text
salesforce-demo/
├── backend/                 Express + TypeScript API
├── frontend/                React + TypeScript + Material UI app
├── data/                    Local JSON persistence
├── README.md                Setup and Salesforce configuration
├── demo.md                  Demo walkthrough
└── learning.md              This guide
```

## Data Files

All persisted app data lives in `data/`.

```text
data/customers.json
data/orders.json
data/sync-events.json
data/salesforce-connection.json
```

- `customers.json`: local Customer records.
- `orders.json`: local Order records.
- `sync-events.json`: sync history for the Sync Monitor.
- `salesforce-connection.json`: Salesforce OAuth connection state.

The app intentionally does not use PostgreSQL, MongoDB, Redis, Docker, or queues.

## Backend Overview

The backend entry point is:

```text
backend/src/server.ts
```

It creates the Express app, enables CORS, registers routes, and starts the Salesforce CDC listener.

Main route groups:

```text
backend/src/routes/authRoutes.ts
backend/src/routes/customerRoutes.ts
backend/src/routes/orderRoutes.ts
backend/src/routes/syncRoutes.ts
backend/src/routes/eventRoutes.ts
```

### Authentication Flow

Salesforce OAuth is handled by:

```text
backend/src/services/salesforceAuthService.ts
```

Important methods:

- `getAuthorizationUrl()`: builds the Salesforce login URL.
- `exchangeCode(code)`: exchanges OAuth code for access and refresh tokens.
- `getValidAccessToken()`: returns a usable token, refreshing when expired.
- `refreshAccessToken()`: refreshes and saves a new access token.

The connection is saved in:

```text
data/salesforce-connection.json
```

No other service should read Salesforce tokens directly.

### Salesforce API Wrapper

All Salesforce API calls go through:

```text
backend/src/services/salesforceClient.ts
```

This wrapper:

- Gets a valid Salesforce connection.
- Retries once after `401 Unauthorized`.
- Refreshes the token automatically.
- Retries temporary network failures up to 3 times.

### Local JSON Persistence

JSON file reading/writing is centralized in:

```text
backend/src/repositories/jsonRepository.ts
backend/src/repositories/store.ts
```

`JsonRepository<T>` creates missing files automatically and reads/writes formatted JSON.

`store.ts` exports repositories for customers, orders, sync events, and Salesforce connection state.

## App to Salesforce Sync

Local create/update/delete actions start in these routes:

```text
backend/src/routes/customerRoutes.ts
backend/src/routes/orderRoutes.ts
```

Flow for creating or updating a customer:

1. Frontend sends `POST /api/customers` or `PUT /api/customers/:id`.
2. Backend validates the request.
3. Backend writes the customer to `data/customers.json` with `syncStatus: "Syncing"`.
4. Backend starts automatic Salesforce sync.
5. Sync service creates sync log entries.
6. Customer becomes `Synced`, `Failed`, or `Conflict`.
7. Frontend receives live SSE updates and refreshes automatically.

The sync service is:

```text
backend/src/services/appToSalesforceSyncService.ts
```

Customer duplicate detection happens before Contact creation:

```sql
SELECT Id, Email, LastModifiedDate
FROM Contact
WHERE Email = 'customer@example.com'
LIMIT 1
```

If a Contact already exists, the app updates it instead of creating a duplicate.

## Salesforce to App Sync

Salesforce CDC subscriptions are handled by:

```text
backend/src/services/salesforceEventListener.ts
```

It subscribes to:

```text
/data/ContactChangeEvent
/data/Order__ChangeEvent
```

When Salesforce sends a CDC event:

1. Backend receives the CDC event.
2. Backend sends the event to the Event Viewer via SSE.
3. Backend fetches the latest Salesforce record.
4. Backend compares Salesforce `LastModifiedDate` with local `lastModified`.
5. Newest record wins.
6. Backend updates local JSON data.
7. Backend writes a sync event.
8. Frontend refreshes automatically.

## Field Mapping

Mapping logic lives in:

```text
backend/src/mappers/customerMapper.ts
backend/src/mappers/orderMapper.ts
```

Customer maps to Salesforce Contact:

```text
firstName -> FirstName
lastName  -> LastName
email     -> Email
phone     -> Phone
```

Order maps to Salesforce `Order__c`:

```text
orderNumber   -> Order_Number__c
amount        -> Amount__c
status        -> Status__c
customerEmail -> Customer_Email__c
```

## Conflict Resolution

Conflict resolution is implemented in:

```text
backend/src/services/salesforceEventListener.ts
```

Rule:

```text
Newest record wins.
```

The backend compares:

```text
local lastModified
Salesforce LastModifiedDate
```

If local data is newer, the record is marked `Conflict`, a conflict event is logged, and Salesforce is updated with the local version.

If Salesforce data is newer, the local JSON record is updated.

## Sync Logs

Sync logs are created by:

```text
backend/src/services/syncLogger.ts
```

They are stored in:

```text
data/sync-events.json
```

The frontend displays them on the Sync Monitor page.

Sync directions:

```text
APP_TO_SALESFORCE
SALESFORCE_TO_APP
```

Statuses:

```text
SUCCESS
FAILED
CONFLICT
SYNCING
```

## Live UI Updates

Live updates use Server-Sent Events.

Backend SSE route:

```text
backend/src/routes/eventRoutes.ts
```

Backend broadcaster:

```text
backend/src/services/eventBus.ts
```

Frontend SSE subscription:

```text
frontend/src/main.tsx
```

The frontend listens for:

- `data-change`
- `sync-event`
- `cdc-event`
- `cdc-snapshot`
- `notification`

This is why the dashboard, tables, Sync Monitor, Event Viewer, and snackbar notifications update without a manual refresh.

## Frontend Overview

Frontend entry point:

```text
frontend/src/main.tsx
```

API client:

```text
frontend/src/services/api.ts
```

Shared TypeScript types:

```text
frontend/src/types/index.ts
```

Reusable UI components:

```text
frontend/src/components/DataTable.tsx
frontend/src/components/StatusChip.tsx
```

Pages:

```text
frontend/src/pages/Dashboard.tsx
frontend/src/pages/CustomersPage.tsx
frontend/src/pages/OrdersPage.tsx
frontend/src/pages/SyncMonitorPage.tsx
frontend/src/pages/EventViewerPage.tsx
```

## End-to-End Flow

### Local App to Salesforce

```text
Frontend form
-> Express route
-> JSON file write
-> AppToSalesforceSyncService
-> Salesforce REST API
-> Sync event log
-> SSE event
-> UI refresh
```

### Salesforce to Local App

```text
Salesforce record update
-> Salesforce CDC event
-> SalesforceEventListener
-> Fetch latest Salesforce record
-> Conflict check
-> JSON file update
-> Sync event log
-> SSE event
-> UI refresh
```

## Important Files to Read First

Start with these files in this order:

1. `backend/src/server.ts`
2. `backend/src/services/salesforceAuthService.ts`
3. `backend/src/services/appToSalesforceSyncService.ts`
4. `backend/src/services/salesforceEventListener.ts`
5. `frontend/src/main.tsx`
6. `frontend/src/pages/CustomersPage.tsx`
7. `frontend/src/pages/EventViewerPage.tsx`

These files explain almost the entire system.
