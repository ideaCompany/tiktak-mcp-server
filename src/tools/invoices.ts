import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { InvoiceListResponse, InvoiceResponse, LogEntryResponse } from "../types.js";

const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitCode: z.string().optional().describe("UN/ECE unit code: HUR (hours), EA (each), DAY (days). Default: HUR"),
  rate: z.number(),
  vatPercent: z.number().optional().describe("VAT percentage (default: 21)"),
  vatCategoryCode: z.string().optional().describe("Peppol VAT category: S (standard), E (exempt), AE (reverse charge). Default: S"),
  sourceLogEntryId: z.string().optional(),
});

export function registerInvoiceTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "list_invoices",
    "List invoices with optional status filter.",
    {
      status: z.enum(["Draft", "Sent", "Paid", "Cancelled"]).optional().describe("Filter by status"),
    },
    async ({ status }) => {
      try {
        const invoices = await api.get<InvoiceListResponse[]>("/api/invoices", {
          status: status ?? undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(invoices, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_invoice",
    "Get full invoice details including line items, totals, and audit history.",
    { invoiceId: z.string().describe("Invoice GUID") },
    async ({ invoiceId }) => {
      try {
        const invoice = await api.get<InvoiceResponse>(`/api/invoices/${invoiceId}`);
        return { content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_uninvoiced_entries",
    "Get completed, uninvoiced time entries for a customer. Use this to see what can be billed before creating an invoice.",
    { customerId: z.string().describe("Customer GUID") },
    async ({ customerId }) => {
      try {
        const entries = await api.get<LogEntryResponse[]>(`/api/invoices/uninvoiced-entries/${customerId}`);
        return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_invoice",
    "Create a DRAFT invoice from time entries. Line items are auto-generated from the selected log entries. The invoice is created as Draft only — to send it, use the TikTak app.",
    {
      customerId: z.string().describe("Customer GUID"),
      logEntryIds: z.array(z.string()).min(1).describe("Log entry GUIDs to include (at least 1)"),
      date: z.string().describe("Invoice date (yyyy-MM-dd)"),
      dueDate: z.string().describe("Due date (yyyy-MM-dd)"),
      contactId: z.string().optional().describe("Contact GUID"),
      vatPercent: z.number().optional().describe("VAT percentage (default: from tenant settings, usually 21)"),
      buyerReference: z.string().optional().describe("Buyer/PO reference (used in Peppol invoices)"),
    },
    async (args) => {
      try {
        const invoice = await api.post<InvoiceResponse>("/api/invoices", args);
        return { content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "update_invoice",
    "Edit a draft invoice's dates, notes, and line items. Only draft invoices can be edited.",
    {
      invoiceId: z.string().describe("Invoice GUID"),
      date: z.string().describe("Invoice date (yyyy-MM-dd)"),
      dueDate: z.string().describe("Due date (yyyy-MM-dd)"),
      buyerReference: z.string().optional(),
      notes: z.string().optional(),
      lineItems: z.array(LineItemSchema).describe("Updated line items"),
    },
    async ({ invoiceId, ...body }) => {
      try {
        const invoice = await api.put<InvoiceResponse>(`/api/invoices/${invoiceId}`, body);
        return { content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "update_invoice_status",
    "Change an invoice's status. Valid transitions: Draft→Sent, Sent→Paid, Sent→Cancelled, Draft→Cancelled. IMPORTANT: Confirm status changes with the user before executing.",
    {
      invoiceId: z.string().describe("Invoice GUID"),
      status: z.enum(["Sent", "Paid", "Cancelled"]).describe("New status"),
    },
    async ({ invoiceId, status }) => {
      try {
        const invoice = await api.put<InvoiceResponse>(`/api/invoices/${invoiceId}/status`, { status });
        return { content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_invoice_source_entries",
    "Get the time log entries that were used to generate an invoice.",
    { invoiceId: z.string().describe("Invoice GUID") },
    async ({ invoiceId }) => {
      try {
        const entries = await api.get<LogEntryResponse[]>(`/api/invoices/${invoiceId}/source-log-entries`);
        return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "archive_invoice",
    "Soft-delete an invoice. Draft/Cancelled invoices release their log entries for re-invoicing.",
    { invoiceId: z.string().describe("Invoice GUID") },
    async ({ invoiceId }) => {
      try {
        await api.delete(`/api/invoices/${invoiceId}`);
        return { content: [{ type: "text", text: "Invoice archived successfully." }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}

function errorResult(e: unknown) {
  const msg = e instanceof TikTakApiError
    ? (e.details ? `${e.message}\n${e.details.join("\n")}` : e.message)
    : String(e);
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}
