import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { LogEntryResponse } from "../types.js";

export function registerLogEntryTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "list_log_entries",
    "List time log entries. Filter by date range and/or customer.",
    {
      from: z.string().optional().describe("Start date (yyyy-MM-dd)"),
      to: z.string().optional().describe("End date (yyyy-MM-dd)"),
      customerId: z.string().optional().describe("Filter by customer GUID"),
    },
    async ({ from, to, customerId }) => {
      try {
        const entries = await api.get<LogEntryResponse[]>("/api/log-entries", { from, to, customerId });
        return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_log_entry",
    "Get full details of a time log entry.",
    { logEntryId: z.string().describe("Log entry GUID") },
    async ({ logEntryId }) => {
      try {
        const entry = await api.get<LogEntryResponse>(`/api/log-entries/${logEntryId}`);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_log_entry",
    "Create a completed manual time entry. Provide either startTime+endTime or duration.",
    {
      customerId: z.string().describe("Customer GUID"),
      serviceId: z.string().describe("Service GUID"),
      date: z.string().describe("Date (yyyy-MM-dd)"),
      contactId: z.string().optional().describe("Contact GUID"),
      projectId: z.string().optional().describe("Project GUID"),
      startTime: z.string().optional().describe("Start time (HH:mm)"),
      endTime: z.string().optional().describe("End time (HH:mm)"),
      duration: z.string().optional().describe("Duration (HH:mm format, e.g. '1:30' for 1.5 hours)"),
      fixedAmount: z.number().optional().describe("Fixed amount (for fixed-price services)"),
      isBillable: z.boolean().optional().describe("Is billable (default: true)"),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async (args) => {
      try {
        const entry = await api.post<LogEntryResponse>("/api/log-entries", args);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "update_log_entry",
    "Update an existing log entry.",
    {
      logEntryId: z.string().describe("Log entry GUID"),
      customerId: z.string().describe("Customer GUID"),
      serviceId: z.string().describe("Service GUID"),
      date: z.string().describe("Date (yyyy-MM-dd)"),
      contactId: z.string().optional(),
      projectId: z.string().optional(),
      startTime: z.string().optional().describe("Start time (HH:mm)"),
      endTime: z.string().optional().describe("End time (HH:mm)"),
      duration: z.string().optional().describe("Duration (HH:mm)"),
      fixedAmount: z.number().optional(),
      isBillable: z.boolean().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ logEntryId, ...body }) => {
      try {
        const entry = await api.put<LogEntryResponse>(`/api/log-entries/${logEntryId}`, body);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "delete_log_entry",
    "Soft-delete a log entry (90-day TTL, recoverable in the TikTak app).",
    { logEntryId: z.string().describe("Log entry GUID") },
    async ({ logEntryId }) => {
      try {
        await api.delete(`/api/log-entries/${logEntryId}`);
        return { content: [{ type: "text", text: "Log entry deleted successfully." }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "start_timer",
    "Start a running timer for a customer and service. The timer runs until you call stop_timer.",
    {
      customerId: z.string().describe("Customer GUID"),
      serviceId: z.string().describe("Service GUID"),
      contactId: z.string().optional().describe("Contact GUID"),
      projectId: z.string().optional().describe("Project GUID"),
      notes: z.string().optional(),
    },
    async (args) => {
      try {
        const entry = await api.post<LogEntryResponse>("/api/log-entries/start-timer", args);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "stop_timer",
    "Stop a running timer. Duration is calculated automatically from start time to now.",
    {
      logEntryId: z.string().describe("Log entry GUID of the running timer"),
      notes: z.string().optional().describe("Optional notes to add when stopping"),
    },
    async ({ logEntryId, notes }) => {
      try {
        const body = notes !== undefined ? { notes } : undefined;
        const entry = await api.post<LogEntryResponse>(`/api/log-entries/${logEntryId}/stop`, body);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "continue_timer",
    "Continue a previously stopped timer. Creates a new running entry with the same customer/service context.",
    { logEntryId: z.string().describe("Log entry GUID of the completed entry to continue") },
    async ({ logEntryId }) => {
      try {
        const entry = await api.post<LogEntryResponse>(`/api/log-entries/${logEntryId}/continue`);
        return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_running_timers",
    "Get all currently running timers.",
    {},
    async () => {
      try {
        const entries = await api.get<LogEntryResponse[]>("/api/log-entries/running");
        return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
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
