import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography,
  TextField, Button, Stack, IconButton, Breadcrumbs, Link, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import { GenericApi } from "../api/genericApi";
import { apiClient } from "../api/client";
import { useRelationOptions } from "../hooks/useRelationOptions";
import RelationSelect from "../components/RelationSelect";

const rfqApi = new GenericApi("/api/purchase/requestforquotations/");
const rfqLineApi = new GenericApi("/api/purchase/requestforquotationlines/");
const vendorQuoteApi = new GenericApi("/api/purchase/vendorquotes/");
const vendorQuoteLineApi = new GenericApi("/api/purchase/vendorquotelines/");

export default function VendorQuoteComparisonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [addOpen, setAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<string | null>(null);
  const [newLeadTime, setNewLeadTime] = useState("");
  const [newQuoteDate, setNewQuoteDate] = useState("");
  const [convertQuoteId, setConvertQuoteId] = useState<string | null>(null);
  const [convertOrderDate, setConvertOrderDate] = useState("");
  const [convertCurrency, setConvertCurrency] = useState<string | null>(null);

  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: ["rfq", id],
    queryFn: () => rfqApi.retrieve(id!),
  });

  const { data: lines = [] } = useQuery({
    queryKey: ["rfq-lines", id],
    queryFn: async () => (await rfqLineApi.list({ filters: { rfq: id }, pageSize: 200 })).results,
  });

  const { data: quotes = [], refetch: refetchQuotes } = useQuery({
    queryKey: ["vendor-quotes", id],
    queryFn: async () => (await vendorQuoteApi.list({ filters: { rfq: id }, pageSize: 200 })).results,
  });

  const { data: quoteLines = [], refetch: refetchQuoteLines } = useQuery({
    queryKey: ["vendor-quote-lines", id],
    queryFn: async () => (await vendorQuoteLineApi.list({ filters: { rfq_line__rfq: id }, pageSize: 500 })).results,
    enabled: lines.length > 0,
  });

  const { options: productOptions } = useRelationOptions("products");
  const { options: uomOptions } = useRelationOptions("uoms", "code");
  const { options: vendorOptions } = useRelationOptions("parties");

  function cellFor(lineId: string, quoteId: string) {
    return quoteLines.find((ql) => ql.rfq_line === lineId && ql.vendor_quote === quoteId);
  }

  function vendorTotal(quoteId: string) {
    return lines.reduce((sum, line) => {
      const cell = cellFor(String(line.id), quoteId);
      if (!cell) return sum;
      return sum + Number(line.quantity) * Number(cell.unit_price ?? 0);
    }, 0);
  }

  async function savePrice(lineId: string, quoteId: string, price: string) {
    const existing = cellFor(lineId, quoteId);
    if (existing) {
      await vendorQuoteLineApi.update(String(existing.id), { unit_price: price });
    } else {
      await vendorQuoteLineApi.create({ vendor_quote: quoteId, rfq_line: lineId, unit_price: price });
    }
    refetchQuoteLines();
  }

  async function createVendorQuote() {
    if (!newVendor) return;
    await vendorQuoteApi.create({
      rfq: id, vendor: newVendor,
      quote_date: newQuoteDate || undefined,
      lead_time_days: newLeadTime || undefined,
    });
    setAddOpen(false);
    setNewVendor(null); setNewLeadTime(""); setNewQuoteDate("");
    refetchQuotes();
    enqueueSnackbar("Vendor quote added", { variant: "success" });
  }

  async function selectQuote(quoteId: string) {
    await apiClient.post(`/api/purchase/vendorquotes/${quoteId}/select/`);
    refetchQuotes();
    enqueueSnackbar("Vendor selected", { variant: "success" });
  }

  async function convertToPO() {
    if (!convertQuoteId) return;
    try {
      const { data } = await apiClient.post(`/api/purchase/vendorquotes/${convertQuoteId}/convert_to_po/`, {
        order_date: convertOrderDate, currency: convertCurrency,
      });
      enqueueSnackbar(`Purchase Order ${data.po_number} created`, { variant: "success" });
      setConvertQuoteId(null);
      navigate(`/purchase-orders/${data.id}`);
    } catch {
      enqueueSnackbar("Conversion failed — check order date and currency", { variant: "error" });
    }
  }

  if (rfqLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(`/rfqs/${id}`)}><ArrowBackIcon /></IconButton>
        <Breadcrumbs>
          <Link underline="hover" color="inherit" onClick={() => navigate("/rfqs")} sx={{ cursor: "pointer" }}>RFQs</Link>
          <Link underline="hover" color="inherit" onClick={() => navigate(`/rfqs/${id}`)} sx={{ cursor: "pointer" }}>
            {String(rfq?.rfq_number ?? "")}
          </Link>
          <Typography color="text.primary">Compare Vendor Quotes</Typography>
        </Breadcrumbs>
      </Stack>

      <Paper sx={{ p: 3, overflowX: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Vendor Comparison</Typography>
          <Button size="small" variant="contained" onClick={() => setAddOpen(true)}>Add Vendor Quote</Button>
        </Stack>

        {lines.length === 0 && <Typography color="text.secondary">No RFQ lines yet — add lines to this RFQ first.</Typography>}
        {lines.length > 0 && quotes.length === 0 && <Typography color="text.secondary">No vendor quotes yet. Add one to start comparing.</Typography>}

        {lines.length > 0 && quotes.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>UOM</TableCell>
                {quotes.map((q) => {
                  const vendorLabel = vendorOptions.find((v) => v.value === q.vendor)?.label ?? String(q.vendor);
                  return (
                    <TableCell key={q.id} align="center" sx={{ minWidth: 160 }}>
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                        <IconButton size="small" onClick={() => selectQuote(String(q.id))}>
                          {q.is_selected ? <StarIcon fontSize="small" color="primary" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                        <Typography variant="body2" fontWeight={600}>{vendorLabel}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {q.lead_time_days ? `${q.lead_time_days}d lead` : "—"}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => {
                const productLabel = productOptions.find((p) => p.value === line.product)?.label ?? String(line.product);
                const uomLabel = uomOptions.find((u) => u.value === line.uom)?.label ?? String(line.uom);
                return (
                  <TableRow key={line.id}>
                    <TableCell>{productLabel}</TableCell>
                    <TableCell>{String(line.quantity)}</TableCell>
                    <TableCell>{uomLabel}</TableCell>
                    {quotes.map((q) => {
                      const cell = cellFor(String(line.id), String(q.id));
                      return (
                        <TableCell key={q.id} align="center">
                          <TextField
                            size="small" type="number" placeholder="Price"
                            defaultValue={cell?.unit_price ?? ""}
                            onBlur={(e) => {
                              if (e.target.value) savePrice(String(line.id), String(q.id), e.target.value);
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={3}><b>Estimated Total</b></TableCell>
                {quotes.map((q) => (
                  <TableCell key={q.id} align="center">
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                      {vendorTotal(String(q.id)).toFixed(2)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} />
                {quotes.map((q) => (
                  <TableCell key={q.id} align="center">
                    {q.is_selected ? (
                      <Button size="small" variant="contained" onClick={() => setConvertQuoteId(String(q.id))}>
                        Convert to PO
                      </Button>
                    ) : (
                      <Chip size="small" label="Not selected" variant="outlined" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Vendor Quote</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <RelationSelect moduleKey="parties" label="Vendor" value={newVendor} onChange={setNewVendor} required />
          <TextField
            size="small" label="Quote Date" type="date" InputLabelProps={{ shrink: true }}
            value={newQuoteDate} onChange={(e) => setNewQuoteDate(e.target.value)}
          />
          <TextField
            size="small" label="Lead Time (days)" type="number"
            value={newLeadTime} onChange={(e) => setNewLeadTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newVendor} onClick={createVendorQuote}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!convertQuoteId} onClose={() => setConvertQuoteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Convert to Purchase Order</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            size="small" label="Order Date" type="date" InputLabelProps={{ shrink: true }} required
            value={convertOrderDate} onChange={(e) => setConvertOrderDate(e.target.value)}
          />
          <RelationSelect
            moduleKey="currencies" labelField="code" label="Currency"
            value={convertCurrency} onChange={setConvertCurrency} required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertQuoteId(null)}>Cancel</Button>
          <Button variant="contained" disabled={!convertOrderDate || !convertCurrency} onClick={convertToPO}>
            Create PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
