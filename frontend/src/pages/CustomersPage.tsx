import { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TableCell, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import { Customer } from "../types";

const empty = { firstName: "", lastName: "", email: "", phone: "" };

export function CustomersPage({ refreshKey, onNotify }: { refreshKey: number; onNotify: (value: any) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty);

  const load = () => void api.customers().then(setCustomers);
  useEffect(load, [refreshKey]);

  const filtered = useMemo(
    () => customers.filter((c) => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())),
    [customers, search]
  );

  const open = (customer?: Customer) => {
    setEditing(customer ?? null);
    setForm(customer ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone } : empty);
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await api.updateCustomer(editing.id, form);
      else await api.createCustomer(form);
      onNotify({ severity: "info", message: "Customer saved. Sync started automatically." });
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
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Customers
        </Typography>
        <TextField size="small" label="Search Customers" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => open()}>
          Create Customer
        </Button>
      </Box>
      <DataTable headers={["Name", "Email", "Phone", "Sync Status", "Last Modified", "Actions"]}>
        {filtered.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>{customer.firstName} {customer.lastName}</TableCell>
            <TableCell>{customer.email}</TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell><StatusChip status={customer.syncStatus} /></TableCell>
            <TableCell>{new Date(customer.lastModified).toLocaleString()}</TableCell>
            <TableCell>
              <IconButton aria-label="edit" onClick={() => open(customer)}><EditIcon /></IconButton>
              <IconButton aria-label="delete" color="error" onClick={() => api.deleteCustomer(customer.id).then(load)}><DeleteIcon /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); setForm(empty); }} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Customer" : "Create Customer"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <TextField label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <TextField label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditing(null); setForm(empty); }}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
