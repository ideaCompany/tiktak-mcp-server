import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TikTakApiClient, TikTakApiError } from "../api-client.js";
import type { CustomerListResponse, CustomerResponse, CreateCustomerRequest } from "../types.js";

const AddressSchema = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
}).optional();

const ContactSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const CustomerServiceSchema = z.object({
  serviceId: z.string().optional().describe("Link to a global service (for rate overrides). Leave empty for customer-specific service."),
  name: z.string().optional(),
  type: z.enum(["BillableTime", "BillableFixed"]).optional(),
  hourlyRate: z.number().optional(),
  fixedAmount: z.number().optional(),
  description: z.string().optional(),
  rounding: z.enum(["None", "FiveMinutes", "FifteenMinutes", "ThirtyMinutes"]).optional(),
  sortOrder: z.number().optional(),
});

export function registerCustomerTools(server: McpServer, api: TikTakApiClient) {
  server.tool(
    "list_customers",
    "List all customers. Returns id, name, company flag, and primary contact.",
    { includeArchived: z.boolean().optional().describe("Include archived customers (default: false)") },
    async ({ includeArchived }) => {
      try {
        const customers = await api.get<CustomerListResponse[]>("/api/customers", {
          includeArchived: includeArchived ? "true" : undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(customers, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "get_customer",
    "Get full customer details including contacts and custom service rates.",
    { customerId: z.string().describe("Customer GUID") },
    async ({ customerId }) => {
      try {
        const customer = await api.get<CustomerResponse>(`/api/customers/${customerId}`);
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_customer",
    "Create a new customer with optional contacts and custom service rates.",
    {
      name: z.string().describe("Customer or company name"),
      isCompany: z.boolean().optional().describe("Is this a company? (default: true)"),
      vatNumber: z.string().optional().describe("VAT number"),
      address: AddressSchema.describe("Customer address"),
      notes: z.string().optional(),
      contacts: z.array(ContactSchema).optional().describe("Contact persons"),
      customServices: z.array(CustomerServiceSchema).optional().describe("Custom service rates for this customer"),
    },
    async (args) => {
      try {
        const body: CreateCustomerRequest = {
          name: args.name,
          isCompany: args.isCompany,
          vatNumber: args.vatNumber,
          address: args.address,
          notes: args.notes,
          contacts: args.contacts,
          customServices: args.customServices,
        };
        const customer = await api.post<CustomerResponse>("/api/customers", body);
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "create_customers_bulk",
    "Create multiple customers at once. Useful for importing from a spreadsheet. Each customer is created independently; failures for one do not block others.",
    {
      customers: z.array(z.object({
        name: z.string(),
        isCompany: z.boolean().optional(),
        vatNumber: z.string().optional(),
        address: AddressSchema,
        notes: z.string().optional(),
        contacts: z.array(ContactSchema).optional(),
        customServices: z.array(CustomerServiceSchema).optional(),
      })).describe("Array of customers to create"),
    },
    async ({ customers }) => {
      const created: CustomerResponse[] = [];
      const failed: { index: number; name: string; error: string }[] = [];

      for (let i = 0; i < customers.length; i++) {
        try {
          const customer = await api.post<CustomerResponse>("/api/customers", customers[i]);
          created.push(customer);
        } catch (e) {
          const msg = e instanceof TikTakApiError ? e.message : String(e);
          failed.push({ index: i, name: customers[i].name, error: msg });
        }
      }

      const result = { created: created.length, failed: failed.length, createdCustomers: created, failures: failed };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "update_customer",
    "Update an existing customer's details, contacts, or custom service rates.",
    {
      customerId: z.string().describe("Customer GUID"),
      name: z.string().describe("Customer name"),
      isCompany: z.boolean().optional(),
      vatNumber: z.string().optional(),
      address: AddressSchema,
      notes: z.string().optional(),
      isArchived: z.boolean().optional(),
      contacts: z.array(ContactSchema).optional(),
      customServices: z.array(CustomerServiceSchema).optional(),
    },
    async ({ customerId, ...body }) => {
      try {
        const customer = await api.put<CustomerResponse>(`/api/customers/${customerId}`, body);
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "archive_customer",
    "Soft-delete a customer (90-day TTL, recoverable in the TikTak app).",
    { customerId: z.string().describe("Customer GUID") },
    async ({ customerId }) => {
      try {
        await api.delete(`/api/customers/${customerId}`);
        return { content: [{ type: "text", text: "Customer archived successfully." }] };
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
