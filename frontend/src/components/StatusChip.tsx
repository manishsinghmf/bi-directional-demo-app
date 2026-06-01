import { Chip } from "@mui/material";
import { SyncStatus } from "../types";

const colors: Record<SyncStatus, "success" | "info" | "error" | "warning"> = {
  Synced: "success",
  Syncing: "info",
  Failed: "error",
  Conflict: "warning"
};

export function StatusChip({ status }: { status: SyncStatus }) {
  return <Chip size="small" color={colors[status]} label={status} />;
}
