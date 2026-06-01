# Demo Guide: Salesforce Bi-Directional Sync Prototype

Use this guide to present the project as a portfolio or resume demo.

## Before the Demo

Make sure Salesforce is configured:

1. Connected App exists.
2. Callback URL is exactly:

```text
http://localhost:4000/auth/salesforce/callback
```

3. OAuth scopes include:

```text
api
refresh_token
offline_access
```

4. Change Data Capture is enabled for:

```text
Contact
Order__c
```

5. `Order__c` exists with fields:

```text
Order_Number__c
Amount__c
Status__c
Customer_Email__c
```

6. `backend/.env` is filled correctly.

Example:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=your_consumer_key
SALESFORCE_CLIENT_SECRET=your_consumer_secret
SALESFORCE_REDIRECT_URI=http://localhost:4000/auth/salesforce/callback
```

7. `frontend/.env` points to the backend:

```env
VITE_API_BASE=http://localhost:4000
```

## Start the App

From the project root:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Keep the terminal visible if you want to show backend activity.

## Demo Script

### 1. Introduce the Project

Say:

```text
This is a local Customer and Order Management application that synchronizes automatically with Salesforce in both directions. It uses OAuth, Salesforce REST APIs, Change Data Capture, duplicate detection, conflict handling, token refresh, and JSON-file persistence.
```

Show the project structure:

```text
frontend/
backend/
data/
```

Mention that the goal is working functionality, not enterprise infrastructure.

### 2. Show the Dashboard

Open the Dashboard page.

Point out:

- Total Customers
- Total Orders
- Salesforce connection status
- Last sync time
- Success and failure counts

### 3. Connect Salesforce

Click **Connect Salesforce**.

Complete Salesforce login and authorization.

After redirect, show the app again and point out that the connection status is now connected.

If already connected, say:

```text
The OAuth token and refresh token are stored locally in salesforce-connection.json, and the backend refreshes the access token automatically when needed.
```

### 4. Create a Customer in the App

Go to **Customers**.

Create a customer with a unique email.

Example:

```text
First Name: Demo
Last Name: Customer
Email: demo.customer@example.com
Phone: 9999999999
```

Point out:

- The record is saved locally first.
- Sync status changes through `Syncing`.
- It becomes `Synced` after Salesforce accepts it.
- No manual sync button is used.

### 5. Verify Contact in Salesforce

Open Salesforce.

Go to:

```text
App Launcher -> Contacts -> All Contacts
```

Search for the email:

```text
demo.customer@example.com
```

Open the Contact and show that it exists.

Optional Developer Console query:

```sql
SELECT Id, FirstName, LastName, Email, Phone, LastModifiedDate
FROM Contact
WHERE Email = 'demo.customer@example.com'
```

### 6. Update Customer in the App

Return to the app.

Edit the customer phone or last name.

Then return to Salesforce and refresh the Contact.

Show that Salesforce updated automatically.

Say:

```text
The backend mapped local fields to Salesforce Contact fields and used the centralized Salesforce client with token refresh and retry handling.
```

### 7. Show Sync Monitor

Open **Sync Monitor**.

Point out entries for:

- `APP_TO_SALESFORCE`
- `CREATE`
- `UPDATE`
- `SUCCESS`
- Any `SYNCING` entries

Explain that sync history is persisted in:

```text
data/sync-events.json
```

### 8. Demonstrate Salesforce to App Sync

Open **Event Viewer** in the app.

In Salesforce, edit the same Contact.

Example:

```text
Phone: 8888888888
```

Save the Contact in Salesforce.

Return to the app.

Show:

- Event Viewer receives a CDC event.
- Customer page updates automatically.
- Sync Monitor shows `SALESFORCE_TO_APP`.

Say:

```text
This proves the app is not polling. Salesforce Change Data Capture sends an event, and the backend applies the change locally.
```

### 9. Demonstrate Duplicate Detection

Create another customer in the app with the same email as the existing Salesforce Contact.

Use a changed phone or name.

Show that:

- The app runs SOQL lookup by email.
- Existing Salesforce Contact is updated.
- A duplicate Contact is not created.

In Salesforce, search Contacts by the same email and show only one matching Contact.

### 10. Demonstrate Orders

Go to **Orders**.

Create an order:

```text
Order Number: ORD-1001
Customer Email: demo.customer@example.com
Amount: 250
Status: Draft
```

Show it becomes `Synced`.

In Salesforce, open the `Order__c` tab or use Developer Console:

```sql
SELECT Id, Order_Number__c, Customer_Email__c, Amount__c, Status__c, LastModifiedDate
FROM Order__c
WHERE Order_Number__c = 'ORD-1001'
```

Edit the order in Salesforce if CDC is enabled for `Order__c`, then show the app receives the event.

### 11. Explain Conflict Resolution

Say:

```text
If Salesforce and the local app both change a record, the backend compares local lastModified with Salesforce LastModifiedDate. The newest record wins. The older side is updated and the conflict is logged.
```

Point to **Sync Monitor** where conflict events would appear as `CONFLICT`.

### 12. Explain Token Refresh

Say:

```text
The backend never lets route handlers read access tokens directly. All Salesforce API calls go through SalesforceAuthService and the Salesforce client wrapper. If an access token expires, it refreshes automatically. If Salesforce returns 401, the request is retried once after refresh.
```

Point to:

```text
backend/src/services/salesforceAuthService.ts
backend/src/services/salesforceClient.ts
```

## Best Demo Order

Use this order for the smoothest presentation:

1. Dashboard
2. Connect Salesforce
3. Create Customer locally
4. Verify Contact in Salesforce
5. Update Customer locally
6. Verify Salesforce update
7. Open Event Viewer
8. Update Contact in Salesforce
9. Verify app update
10. Show Sync Monitor
11. Create duplicate customer by email
12. Create Order
13. Explain architecture and code structure

## Troubleshooting During Demo

### Contact does not update app

Check:

- Backend was restarted after Salesforce connection.
- CDC is enabled for Contact.
- Event Viewer is open before making the Salesforce edit.
- You made a new Salesforce edit after the backend listener started.

### OAuth redirect fails

Check exact callback URL:

```text
http://localhost:4000/auth/salesforce/callback
```

It must match in both Salesforce Connected App and `backend/.env`.

### Order sync fails

Check that `Order__c` and all required fields exist in Salesforce.

### Sync status shows Failed

Open Sync Monitor and read the message column. Salesforce validation errors and missing-field errors are shown there.

## Closing Statement

Use this as the final explanation:

```text
This project demonstrates a complete integration workflow: OAuth authorization, local persistence, automatic app-to-Salesforce writes, Salesforce CDC subscriptions for inbound updates, duplicate detection, conflict resolution, token refresh, and real-time UI monitoring.
```
