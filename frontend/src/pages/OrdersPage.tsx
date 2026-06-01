import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TableCell, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import { Order } from "../types";

const empty = { orderNumber: "", customerEmail: "", amount: 0, status: "Draft" };

export function OrdersPage({ refreshKey, onNotify }: { refreshKey: number; onNotify: (value: any) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState(empty);

  const load = () => void api.orders().then(setOrders);
  useEffect(load, [refreshKey]);

  const open = (order?: Order) => {
    setEditing(order ?? null);
    setForm(order ? { orderNumber: order.orderNumber, customerEmail: order.customerEmail, amount: order.amount, status: order.status } : empty);
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await api.updateOrder(editing.id, form);
      else await api.createOrder(form);
      onNotify({ severity: "info", message: "Order saved. Sync started automatically." });
      setEditing(null);
      setForm(empty);
      setDialogOpen(false);
      load();
    } catch (error: any) {
      onNotify({ severity: "error", message: error.message });
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Orders</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => open()}>Create Order</Button>
      </Box>
      <DataTable headers={["Order Number", "Customer Email", "Amount", "Status", "Sync Status", "Last Modified", "Actions"]}>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.orderNumber}</TableCell>
            <TableCell>{order.customerEmail}</TableCell>
            <TableCell>${order.amount.toFixed(2)}</TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell><StatusChip status={order.syncStatus} /></TableCell>
            <TableCell>{new Date(order.lastModified).toLocaleString()}</TableCell>
            <TableCell>
              <IconButton aria-label="edit" onClick={() => open(order)}><EditIcon /></IconButton>
              <IconButton aria-label="delete" color="error" onClick={() => api.deleteOrder(order.id).then(load)}><DeleteIcon /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); setForm(empty); }} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Order" : "Create Order"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="Order Number" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} />
          <TextField label="Customer Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
          <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditing(null); setForm(empty); }}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
