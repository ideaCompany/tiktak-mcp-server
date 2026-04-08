export class TikTakApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message);
    this.name = "TikTakApiError";
  }
}

export class TikTakApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = "https://api.tiktakme.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: "GET" });
  }

  async getBuffer(path: string, params?: Record<string, string | undefined>): Promise<{ data: Buffer; contentType: string; fileName?: string }> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Api-Key": this.apiKey },
    });
    if (!res.ok) {
      await this.handleError(res);
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const disposition = res.headers.get("content-disposition") ?? "";
    const fileNameMatch = disposition.match(/filename="?([^";\n]+)"?/);
    const fileName = fileNameMatch?.[1];
    const arrayBuffer = await res.arrayBuffer();
    return { data: Buffer.from(arrayBuffer), contentType, fileName };
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "X-Api-Key": this.apiKey },
    });
    if (!res.ok) {
      await this.handleError(res);
    }
  }

  private buildUrl(path: string, params?: Record<string, string | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("X-Api-Key", this.apiKey);

    let res = await fetch(url, { ...init, headers });

    // Retry once on 429
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 30000)));
      res = await fetch(url, { ...init, headers });
    }

    if (!res.ok) {
      await this.handleError(res);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  private async handleError(res: Response): Promise<never> {
    let message: string;
    let details: string[] | undefined;

    try {
      const body = await res.json();
      message = body.message ?? body.title ?? JSON.stringify(body);
      if (body.errors) {
        details = Object.entries(body.errors).flatMap(([field, msgs]) =>
          (msgs as string[]).map((m) => `${field}: ${m}`),
        );
      }
    } catch {
      message = await res.text().catch(() => res.statusText);
    }

    switch (res.status) {
      case 401:
        throw new TikTakApiError(401, "Authentication failed. Check your TIKTAK_API_KEY.");
      case 403:
        throw new TikTakApiError(403, "Permission denied. Your API key may lack the required role (Admin+ required).");
      case 404:
        throw new TikTakApiError(404, `Resource not found: ${message}`);
      case 429:
        throw new TikTakApiError(429, "Rate limit exceeded. Try again later.");
      default:
        if (res.status >= 500) {
          throw new TikTakApiError(res.status, "TikTak API is temporarily unavailable. Try again later.");
        }
        throw new TikTakApiError(res.status, message, details);
    }
  }
}
