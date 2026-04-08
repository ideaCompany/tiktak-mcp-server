import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { DashboardStatsResponse } from "../types.js";

export function registerDashboardTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "get_dashboard_stats",
    "Get dashboard statistics: hours tracked this month vs last month, revenue, outstanding and overdue amounts, invoice counts, top customers by hours, and daily hour breakdown.",
    {},
    async () => {
      try {
        const stats = await api.get<DashboardStatsResponse>("/api/dashboard/stats");
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
      } catch (e) {
        const msg = e instanceof TikTakApiError ? e.message : String(e);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    },
  );
}
