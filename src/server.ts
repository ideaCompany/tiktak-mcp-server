import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TikTakApiClient } from "./api-client.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerServiceTools } from "./tools/services.js";
import { registerLogEntryTools } from "./tools/log-entries.js";
import { registerInvoiceTools } from "./tools/invoices.js";
import { registerDashboardTools } from "./tools/dashboard.js";
import { registerExportTools } from "./tools/exports.js";
import { registerSettingsTools } from "./tools/settings.js";
import type { CustomerListResponse, ServiceResponse, LogEntryResponse, TenantSettingsResponse } from "./types.js";

export function createServer(api: TikTakApiClient): McpServer {
  const server = new McpServer({
    name: "tiktak",
    version: "0.1.0",
  });

  // Register all tools
  registerCustomerTools(server, api);
  registerServiceTools(server, api);
  registerLogEntryTools(server, api);
  registerInvoiceTools(server, api);
  registerDashboardTools(server, api);
  registerExportTools(server, api);
  registerSettingsTools(server, api);

  // Register resources
  registerResources(server, api);

  return server;
}

function registerResources(server: McpServer, api: TikTakApiClient) {
  server.resource(
    "customers",
    "tiktak://customers",
    "Active customer list (id + name) for resolving customer references",
    async () => {
      const customers = await api.get<CustomerListResponse[]>("/api/customers");
      const summary = customers.map((c) => ({ id: c.id, name: c.name, isCompany: c.isCompany }));
      return { contents: [{ uri: "tiktak://customers", mimeType: "application/json", text: JSON.stringify(summary, null, 2) }] };
    },
  );

  server.resource(
    "services",
    "tiktak://services",
    "Active service list (id, name, type, rate) for resolving service references",
    async () => {
      const services = await api.get<ServiceResponse[]>("/api/services");
      const summary = services.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        hourlyRate: s.hourlyRate,
        fixedAmount: s.fixedAmount,
      }));
      return { contents: [{ uri: "tiktak://services", mimeType: "application/json", text: JSON.stringify(summary, null, 2) }] };
    },
  );

  server.resource(
    "running-timers",
    "tiktak://running-timers",
    "Currently running timers",
    async () => {
      const timers = await api.get<LogEntryResponse[]>("/api/log-entries/running");
      return { contents: [{ uri: "tiktak://running-timers", mimeType: "application/json", text: JSON.stringify(timers, null, 2) }] };
    },
  );

  server.resource(
    "settings",
    "tiktak://settings",
    "Tenant settings (company name, currency, defaults)",
    async () => {
      const settings = await api.get<TenantSettingsResponse>("/api/settings");
      return { contents: [{ uri: "tiktak://settings", mimeType: "application/json", text: JSON.stringify(settings, null, 2) }] };
    },
  );
}
