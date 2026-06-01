import { Stack, TableCell, TableRow, Typography } from "@mui/material";
import { DataTable } from "../components/DataTable";
import { LiveCdcEvent } from "../types";

export function EventViewerPage({ events }: { events: LiveCdcEvent[] }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Event Viewer</Typography>
      <DataTable headers={["Event Time", "Event Type", "Object", "Record Id", "Change Type"]}>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{new Date(event.eventTime).toLocaleString()}</TableCell>
            <TableCell>{event.eventType}</TableCell>
            <TableCell>{event.object}</TableCell>
            <TableCell>{event.recordId}</TableCell>
            <TableCell>{event.changeType}</TableCell>
          </TableRow>
        ))}
      </DataTable>
    </Stack>
  );
}
