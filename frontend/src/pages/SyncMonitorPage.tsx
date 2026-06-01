import { useEffect, useState } from "react";
import { Chip, Stack, TableCell, TableRow, Typography } from "@mui/material";
import { DataTable } from "../components/DataTable";
import { api } from "../services/api";
import { SyncEvent } from "../types";

export function SyncMonitorPage({ refreshKey }: { refreshKey: number }) {
  const [events, setEvents] = useState<SyncEvent[]>([]);
  useEffect(() => {
    void api.syncEvents().then(setEvents);
  }, [refreshKey]);

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Sync Monitor</Typography>
      <DataTable headers={["Timestamp", "Entity Type", "Entity ID", "Direction", "Operation", "Status", "Message"]}>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
            <TableCell>{event.entityType}</TableCell>
            <TableCell>{event.entityId}</TableCell>
            <TableCell>{event.direction}</TableCell>
            <TableCell>{event.operation}</TableCell>
            <TableCell><Chip size="small" label={event.status} color={event.status === "FAILED" ? "error" : event.status === "CONFLICT" ? "warning" : event.status === "SYNCING" ? "info" : "success"} /></TableCell>
            <TableCell>{event.message}</TableCell>
          </TableRow>
        ))}
      </DataTable>
    </Stack>
  );
}
