import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { api } from "../services/api";
import { SyncStatusSummary } from "../types";

export function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [status, setStatus] = useState<SyncStatusSummary | null>(null);

  useEffect(() => {
    void api.syncStatus().then(setStatus);
  }, [refreshKey]);

  const cards = [
    ["Total Customers", status?.totalCustomers ?? 0],
    ["Total Orders", status?.totalOrders ?? 0],
    ["Sync Success Count", status?.syncSuccessCount ?? 0],
    ["Sync Failure Count", status?.syncFailureCount ?? 0]
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary">Local JSON data synchronized automatically with Salesforce.</Typography>
      </Box>
      <Alert severity={status?.salesforceConnected ? "success" : "warning"}>
        Salesforce Connection Status:{" "}
        <Chip size="small" label={status?.salesforceConnected ? "Connected" : "Disconnected"} color={status?.salesforceConnected ? "success" : "warning"} />
        {status?.instanceUrl ? ` ${status.instanceUrl}` : ""}
      </Alert>
      <Grid container spacing={2}>
        {cards.map(([label, value]) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {label}
                </Typography>
                <Typography variant="h4">{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary" variant="body2">
            Last Sync Time
          </Typography>
          <Typography>{status?.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : "No successful sync yet"}</Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
