import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";

export function registerExportTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "export_log_entries",
    "Export time log entries as PDF or Excel file. Returns base64-encoded file data.",
    {
      format: z.enum(["pdf", "excel"]).describe("Export format"),
      from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
      to: z.string().optional().describe("End date (yyyy-MM-dd)"),
      customerId: z.string().optional().describe("Filter by customer GUID"),
    },
    async ({ format, from, to, customerId }) => {
      try {
        const path = `/api/exports/log-entries/${format}`;
        const { data, contentType, fileName } = await api.getBuffer(path, { from, to, customerId });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              fileName: fileName ?? `log-entries.${format === "pdf" ? "pdf" : "xlsx"}`,
              contentType,
              sizeBytes: data.length,
              data: data.toString("base64"),
            }),
          }],
        };
      } catch (e) {
        const msg = e instanceof TikTakApiError ? e.message : String(e);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );

  server.tool(
    "export_invoice",
    "Export an invoice as PDF or Excel file. Returns base64-encoded file data.",
    {
      invoiceId: z.string().describe("Invoice GUID"),
      format: z.enum(["pdf", "excel"]).describe("Export format"),
    },
    async ({ invoiceId, format }) => {
      try {
        const path = `/api/invoices/${invoiceId}/${format}`;
        const { data, contentType, fileName } = await api.getBuffer(path);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              fileName: fileName ?? `invoice.${format === "pdf" ? "pdf" : "xlsx"}`,
              contentType,
              sizeBytes: data.length,
              data: data.toString("base64"),
            }),
          }],
        };
      } catch (e) {
        const msg = e instanceof TikTakApiError ? e.message : String(e);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );
}
