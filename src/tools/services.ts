import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { ServiceResponse } from "../types.js";

export function registerServiceTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "list_services",
    "List all service definitions with their types and rates.",
    { includeArchived: z.boolean().optional().describe("Include archived services (default: false)") },
    async ({ includeArchived }) => {
      try {
        const services = await api.get<ServiceResponse[]>("/api/services", {
          includeArchived: includeArchived ? "true" : undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(services, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_service",
    "Get details of a specific service definition.",
    { serviceId: z.string().describe("Service GUID") },
    async ({ serviceId }) => {
      try {
        const service = await api.get<ServiceResponse>(`/api/services/${serviceId}`);
        return { content: [{ type: "text", text: JSON.stringify(service, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_service",
    "Create a new service definition. Use BillableTime for hourly services, BillableFixed for fixed-price services.",
    {
      name: z.string().describe("Service name"),
      type: z.enum(["BillableTime", "BillableFixed"]).optional().describe("Service type (default: BillableTime)"),
      hourlyRate: z.number().optional().describe("Hourly rate (for BillableTime)"),
      fixedAmount: z.number().optional().describe("Fixed amount (for BillableFixed)"),
      description: z.string().optional(),
      rounding: z.enum(["None", "FiveMinutes", "FifteenMinutes", "ThirtyMinutes"]).optional().describe("Time rounding (default: None)"),
      sortOrder: z.number().optional().describe("Display sort order"),
    },
    async (args) => {
      try {
        const service = await api.post<ServiceResponse>("/api/services", args);
        return { content: [{ type: "text", text: JSON.stringify(service, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_services_bulk",
    "Create multiple services at once. Useful for setting up a new account. Each service is created independently; failures for one do not block others.",
    {
      services: z.array(z.object({
        name: z.string(),
        type: z.enum(["BillableTime", "BillableFixed"]).optional(),
        hourlyRate: z.number().optional(),
        fixedAmount: z.number().optional(),
        description: z.string().optional(),
        rounding: z.enum(["None", "FiveMinutes", "FifteenMinutes", "ThirtyMinutes"]).optional(),
        sortOrder: z.number().optional(),
      })).describe("Array of services to create"),
    },
    async ({ services }) => {
      const created: ServiceResponse[] = [];
      const failed: { index: number; name: string; error: string }[] = [];

      for (let i = 0; i < services.length; i++) {
        try {
          const service = await api.post<ServiceResponse>("/api/services", services[i]);
          created.push(service);
        } catch (e) {
          const msg = e instanceof TikTakApiError ? e.message : String(e);
          failed.push({ index: i, name: services[i].name, error: msg });
        }
      }

      const result = { created: created.length, failed: failed.length, createdServices: created, failures: failed };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "update_service",
    "Update an existing service definition.",
    {
      serviceId: z.string().describe("Service GUID"),
      name: z.string().describe("Service name"),
      type: z.enum(["BillableTime", "BillableFixed"]).optional(),
      hourlyRate: z.number().optional(),
      fixedAmount: z.number().optional(),
      description: z.string().optional(),
      rounding: z.enum(["None", "FiveMinutes", "FifteenMinutes", "ThirtyMinutes"]).optional(),
      sortOrder: z.number().optional(),
      isArchived: z.boolean().optional(),
    },
    async ({ serviceId, ...body }) => {
      try {
        const service = await api.put<ServiceResponse>(`/api/services/${serviceId}`, body);
        return { content: [{ type: "text", text: JSON.stringify(service, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "archive_service",
    "Soft-delete a service (90-day TTL, recoverable in the TikTak app).",
    { serviceId: z.string().describe("Service GUID") },
    async ({ serviceId }) => {
      try {
        await api.delete(`/api/services/${serviceId}`);
        return { content: [{ type: "text", text: "Service archived successfully." }] };
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
