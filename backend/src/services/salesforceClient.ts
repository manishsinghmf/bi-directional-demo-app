import jsforce from "jsforce";
import { salesforceAuthService } from "./salesforceAuthService.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isUnauthorized(error: any): boolean {
  return error?.errorCode === "INVALID_SESSION_ID" || error?.statusCode === 401 || error?.status === 401;
}

function isNetworkError(error: any): boolean {
  return ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED"].includes(error?.code);
}

export async function withSalesforce<T>(operation: (conn: jsforce.Connection) => Promise<T>): Promise<T> {
  let conn = await salesforceAuthService.getConnection();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation(conn);
    } catch (error: any) {
      if (isUnauthorized(error)) {
        conn = await salesforceAuthService.getConnection(true);
        return operation(conn);
      }
      if (attempt < 3 && isNetworkError(error)) {
        await wait(500 * attempt);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Salesforce request failed after retries.");
}
