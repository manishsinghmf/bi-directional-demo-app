import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CssBaseline,
  Snackbar,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from "@mui/material";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { api } from "./services/api";
import { Dashboard } from "./pages/Dashboard";
import { CustomersPage } from "./pages/CustomersPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SyncMonitorPage } from "./pages/SyncMonitorPage";
import { EventViewerPage } from "./pages/EventViewerPage";
import { LiveCdcEvent } from "./types";

type Page = "dashboard" | "customers" | "orders" | "sync" | "events";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [events, setEvents] = useState<LiveCdcEvent[]>([]);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "info" | "warning" | "error" } | null>(null);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#1f6feb" },
          secondary: { main: "#2e7d32" },
          background: { default: "#f7f8fa" }
        },
        shape: { borderRadius: 8 }
      }),
    []
  );

  useEffect(() => {
    const source = new EventSource(api.liveEventsUrl);
    source.addEventListener("data-change", () => setRefreshKey((value) => value + 1));
    source.addEventListener("sync-event", () => setRefreshKey((value) => value + 1));
    source.addEventListener("cdc-event", (message) => {
      const event = JSON.parse((message as MessageEvent).data) as LiveCdcEvent;
      setEvents((current) => [event, ...current].slice(0, 100));
      setRefreshKey((value) => value + 1);
    });
    source.addEventListener("cdc-snapshot", (message) => {
      setEvents(JSON.parse((message as MessageEvent).data));
    });
    source.addEventListener("notification", (message) => setSnack(JSON.parse((message as MessageEvent).data)));
    return () => source.close();
  }, []);

  const connect = () => {
    window.location.href = api.loginUrl;
  };

  const disconnect = async () => {
    await api.disconnect();
    setSnack({ message: "Salesforce disconnected", severity: "info" });
    setRefreshKey((value) => value + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <CloudDoneIcon color="primary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Salesforce Bi-Directional Sync
          </Typography>
          <Button startIcon={<CloudDoneIcon />} variant="contained" onClick={connect}>
            Connect Salesforce
          </Button>
          <Button startIcon={<LinkOffIcon />} color="inherit" onClick={disconnect}>
            Disconnect
          </Button>
        </Toolbar>
        <Tabs value={page} onChange={(_, value) => setPage(value)} variant="scrollable" sx={{ px: 2, bgcolor: "background.paper" }}>
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Customers" value="customers" />
          <Tab label="Orders" value="orders" />
          <Tab label="Sync Monitor" value="sync" />
          <Tab label="Event Viewer" value="events" />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ p: 3, maxWidth: 1280, mx: "auto" }}>
        {page === "dashboard" && <Dashboard refreshKey={refreshKey} />}
        {page === "customers" && <CustomersPage refreshKey={refreshKey} onNotify={setSnack} />}
        {page === "orders" && <OrdersPage refreshKey={refreshKey} onNotify={setSnack} />}
        {page === "sync" && <SyncMonitorPage refreshKey={refreshKey} />}
        {page === "events" && <EventViewerPage events={events} />}
      </Box>
      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity ?? "info"} onClose={() => setSnack(null)} variant="filled">
          {snack?.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
