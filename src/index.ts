import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TikTakApiClient } from "./api-client.js";
import { createServer } from "./server.js";

async function main() {
  const apiKey = process.env.TIKTAK_API_KEY;
  if (!apiKey) {
    console.error("Error: TIKTAK_API_KEY environment variable is required.");
    console.error("");
    console.error("Get your API key from the TikTak app: Settings > API Keys");
    console.error("Then set it: export TIKTAK_API_KEY=tk_your_key_here");
    process.exit(1);
  }

  const apiUrl = process.env.TIKTAK_API_URL ?? "https://api.tiktakme.com";
  const api = new TikTakApiClient(apiKey, apiUrl);

  // Validate the API key on startup
  try {
    await api.get("/api/settings");
  } catch (e) {
    console.error(`Error: Failed to connect to TikTak API at ${apiUrl}`);
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  const server = createServer(api);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
