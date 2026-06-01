# Salesforce Bi-Directional Sync Demo

Portfolio prototype demonstrating automatic two-way synchronization between a local Customer and Order Management app and Salesforce.

## Stack

- Frontend: React, TypeScript, Material UI, Vite
- Backend: Node.js, Express, TypeScript
- Storage: local JSON files in `data/`
- Salesforce: OAuth 2.0 Authorization Code Flow, REST API, Change Data Capture via `jsforce`

## Setup

```bash
npm install
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your Salesforce Connected App values.

## Salesforce Connected App

1. In Salesforce Setup, create a Connected App.
2. Enable OAuth settings.
3. Set callback URL to:
   `http://localhost:4000/auth/salesforce/callback`
4. Add OAuth scopes:
   - Manage user data via APIs
   - Perform requests at any time
   - Refresh token, offline access
5. Copy Consumer Key and Consumer Secret into `backend/.env`.

## Salesforce Order Object

Create custom object `Order__c` with fields:

- `Order_Number__c` Text
- `Amount__c` Number or Currency
- `Status__c` Text or Picklist
- `Customer_Email__c` Email or Text

## CDC Configuration

In Salesforce Setup, enable Change Data Capture for:

- Contact
- Order__c

The backend subscribes to:

- `/data/ContactChangeEvent`
- `/data/Order__ChangeEvent`

## Run

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo Walkthrough

1. Click Connect Salesforce and complete OAuth login.
2. Create a customer in the app.
3. Confirm a Contact appears in Salesforce.
4. Edit the customer in the app.
5. Confirm the Salesforce Contact updates.
6. Edit the Contact in Salesforce.
7. Watch the CDC event appear in Event Viewer.
8. Confirm local JSON data and the UI update automatically.
9. Create another customer with the same email.
10. Confirm the existing Salesforce Contact is updated instead of duplicated.
11. Create and update an order.
12. Confirm `Order__c` records sync.
13. Review Sync Monitor for success, failure, conflict, and syncing entries.

## Notes

- All Salesforce API calls go through `SalesforceAuthService` and the Salesforce client wrapper.
- Expired tokens are refreshed automatically.
- `401 Unauthorized` retries once after token refresh.
- Network errors retry up to three times.
- Conflict resolution uses newest record wins by comparing local `lastModified` and Salesforce `LastModifiedDate`.
