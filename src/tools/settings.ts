import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { TenantSettingsResponse } from "../types.js";

export function registerSettingsTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "get_settings",
    "Get tenant settings: company details, invoice prefix, default VAT %, time rounding, language, and plan tier. Read-only — to change settings, use the TikTak app.",
    {},
    async () => {
      try {
        const settings = await api.get<TenantSettingsResponse>("/api/settings");
        return { content: [{ type: "text", text: JSON.stringify(settings, null, 2) }] };
      } catch (e) {
        const msg = e instanceof TikTakApiError ? e.message : String(e);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );
}
