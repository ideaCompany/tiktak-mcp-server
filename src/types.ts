// --- Enums ---

export type ServiceType = "BillableTime" | "BillableFixed";
export type TimeRounding = "None" | "FiveMinutes" | "FifteenMinutes" | "ThirtyMinutes";
export type LogEntryStatus = "Running" | "Completed" | "Invoiced";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Cancelled";

// --- Address ---

export interface AddressDto {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

// --- Customer ---

export interface CustomerListResponse {
  id: string;
  name: string;
  isCompany: boolean;
  vatNumber?: string;
  isArchived: boolean;
  primaryContactName?: string;
  primaryContactRole?: string;
  lastLogEntry?: string;
}

export interface ContactResponse {
  id: string;
  customerId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface CustomerServiceResponse {
  id: string;
  customerId: string;
  serviceId?: string;
  name: string;
  type: ServiceType;
  hourlyRate?: number;
  fixedAmount?: number;
  description?: string;
  rounding: TimeRounding;
  sortOrder: number;
}

export interface CustomerResponse {
  id: string;
  name: string;
  isCompany: boolean;
  vatNumber?: string;
  address?: AddressDto;
  notes?: string;
  isArchived: boolean;
  contacts: ContactResponse[];
  customServices: CustomerServiceResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface CreateCustomerServiceRequest {
  serviceId?: string;
  name?: string;
  type?: ServiceType;
  hourlyRate?: number;
  fixedAmount?: number;
  description?: string;
  rounding?: TimeRounding;
  sortOrder?: number;
}

export interface CreateCustomerRequest {
  name: string;
  isCompany?: boolean;
  vatNumber?: string;
  address?: AddressDto;
  notes?: string;
  contacts?: CreateContactRequest[];
  customServices?: CreateCustomerServiceRequest[];
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  isArchived?: boolean;
}

// --- Service ---

export interface ServiceResponse {
  id: string;
  name: string;
  type: ServiceType;
  hourlyRate?: number;
  fixedAmount?: number;
  description?: string;
  rounding: TimeRounding;
  sortOrder: number;
  isArchived: boolean;
}

export interface CreateServiceRequest {
  name: string;
  type?: ServiceType;
  hourlyRate?: number;
  fixedAmount?: number;
  description?: string;
  rounding?: TimeRounding;
  sortOrder?: number;
}

export interface UpdateServiceRequest extends CreateServiceRequest {
  isArchived?: boolean;
}

// --- Log Entry ---

export interface AttachmentResponse {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface LogEntryResponse {
  id: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  serviceId: string;
  serviceName: string;
  projectId?: string;
  invoiceId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  rounding: TimeRounding;
  billableDuration?: string;
  fixedAmount?: number;
  isBillable: boolean;
  notes?: string;
  tags: string[];
  attachments: AttachmentResponse[];
  status: LogEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogEntryRequest {
  customerId: string;
  contactId?: string;
  serviceId: string;
  projectId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  fixedAmount?: number;
  isBillable?: boolean;
  notes?: string;
  tags?: string[];
}

export interface UpdateLogEntryRequest extends CreateLogEntryRequest {}

export interface StartTimerRequest {
  customerId: string;
  contactId?: string;
  serviceId: string;
  projectId?: string;
  notes?: string;
}

export interface StopTimerRequest {
  notes?: string;
}

// --- Invoice ---

export interface InvoiceLineItemDto {
  description: string;
  quantity: number;
  unitCode?: string;
  rate: number;
  vatPercent?: number;
  vatCategoryCode?: string;
  sourceLogEntryId?: string;
}

export interface InvoiceAuditEventResponse {
  timestamp: string;
  type: string;
  description: string;
  actorEmail?: string;
  status: string;
  errorMessage?: string;
  toolId?: string;
  externalId?: string;
  details?: string;
}

export interface InvoiceListResponse {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  lastEmailSentAt?: string;
  syncedToolIds: string[];
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  projectId?: string;
  currency: string;
  date: string;
  dueDate: string;
  paidDate?: string;
  buyerReference?: string;
  notes?: string;
  lineItems: InvoiceLineItemDto[];
  originalLineItems: InvoiceLineItemDto[];
  sourceLogEntryIds: string[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  history: InvoiceAuditEventResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  customerId: string;
  contactId?: string;
  date: string;
  dueDate: string;
  vatPercent?: number;
  buyerReference?: string;
  logEntryIds: string[];
}

export interface UpdateInvoiceRequest {
  date: string;
  dueDate: string;
  buyerReference?: string;
  notes?: string;
  lineItems: InvoiceLineItemDto[];
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
}

// --- Dashboard ---

export interface CustomerBreakdown {
  customerId: string;
  customerName: string;
  hours: number;
  revenue: number;
}

export interface DailyHours {
  date: string;
  hours: number;
  billableHours: number;
}

export interface UserBreakdown {
  userId: string;
  userName: string;
  hoursThisMonth: number;
  entriesThisMonth: number;
}

export interface DashboardStatsResponse {
  totalHoursThisMonth: number;
  billableHoursThisMonth: number;
  totalHoursLastMonth: number;
  entriesThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  outstandingAmount: number;
  overdueAmount: number;
  currency: string;
  draftInvoices: number;
  sentInvoices: number;
  paidInvoicesThisMonth: number;
  overdueInvoices: number;
  topCustomers: CustomerBreakdown[];
  dailyHoursThisMonth: DailyHours[];
  userBreakdowns: UserBreakdown[];
}

// --- Settings ---

export interface TenantSettingsResponse {
  companyName: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  address?: AddressDto;
  iban?: string;
  invoicePrefix: string;
  invoiceNextSeq: number;
  defaultVatPercent: number;
  timeRounding: TimeRounding;
  language: string;
  plan: string;
  invoiceEmailSubjectTemplate?: string;
  invoiceEmailBodyTemplate?: string;
  invoiceEmailSendCopy: boolean;
  invoiceEmailDefaultBcc?: string;
}
