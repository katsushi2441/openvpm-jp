import type { Metadata } from "next";
import { WEBHOOK_EVENT_DEFINITIONS } from "@/lib/webhook-events";
import { tx } from "@/lib/i18n";

export const metadata: Metadata = {
  title: tx("OpenVPM API Reference"),
  description: tx("API documentation for OpenVPM veterinary practice management"),
};

// ── Endpoint definitions ─────────────────────────────────────

interface Endpoint {
  name: string;
  method: "GET" | "POST";
  description: string;
  input?: string;
  response?: string;
  auth?: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  endpoints: Endpoint[];
}

const sections: Section[] = [
  {
    id: "auth",
    title: tx("Authentication"),
    description:
      tx("Register practices and retrieve the current user session. Dashboard procedures use session cookies; portal and REST endpoints use their own token/key flows."),
    endpoints: [
      {
        name: "auth.register",
        method: "POST",
        description: tx("Register a new practice with an admin user account."),
        input: `{
  practiceName: string,
  country: "US" | "CA" | "GB" | "IE" | "AU" | "JP",
  name?: string,
  email: string,
  password: string   // min 8 characters
}`,
        response: `{ success: true }`,
        auth: "None (public)",
      },
      {
        name: "auth.me",
        method: "GET",
        description: tx("Get the current authenticated user and practice details."),
        response: `{
  id: string,
  email: string,
  name: string,
  role: "admin" | "veterinarian" | "technician" | "front_desk",
  practiceId: string,
  practiceName: string
}`,
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "clients",
    title: tx("Clients"),
    description: tx("Manage pet owners / client records."),
    endpoints: [
      {
        name: "clients.list",
        method: "GET",
        description: tx("List clients with optional search and pagination."),
        input: `{
  search?: string,
  limit?: number,    // 1-100, default 25
  offset?: number    // default 0
}`,
        response: `{
  items: Client[],
  total: number
}`,
      },
      {
        name: "clients.search",
        method: "GET",
        description:
          tx("Quick search clients by name, email, or phone. Returns up to 10 results."),
        input: `{ query: string }`,
        response: `Client[]`,
      },
      {
        name: "clients.getById",
        method: "GET",
        description: tx("Get a single client with their patients."),
        input: `{ id: string }`,
        response: `{
  ...Client,
  patients: Patient[]
}`,
      },
      {
        name: "clients.create",
        method: "POST",
        description:
          tx("Create a new client record and issue a private portal access token."),
        input: `{
  firstName: string,
  lastName: string,
  email?: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  zip?: string
}`,
        response: `Client`,
      },
      {
        name: "clients.rotatePortalAccessToken",
        method: "POST",
        description:
          tx("Create or rotate a client's private portal link. Existing portal URLs stop working immediately after rotation."),
        input: `{ id: string }`,
        response: `{
  id: string,
  accessToken: string
}`,
      },
      {
        name: "clients.update",
        method: "POST",
        description: tx("Update an existing client."),
        input: `{
  id: string,
  firstName?: string,
  lastName?: string,
  email?: string,
  phone?: string,
  address?: string,
  city?: string,
  state?: string,
  zip?: string
}`,
        response: `Client`,
      },
      {
        name: "clients.delete",
        method: "POST",
        description: tx("Soft-delete a client record."),
        input: `{ id: string }`,
        response: `{ success: true }`,
      },
    ],
  },
  {
    id: "patients",
    title: tx("Patients"),
    description: tx("Manage animal patient records, weights, and allergies."),
    endpoints: [
      {
        name: "patients.list",
        method: "GET",
        description: tx("List patients with optional filters."),
        input: `{
  search?: string,
  species?: string,
  status?: string,
  limit?: number,    // 1-100, default 25
  offset?: number    // default 0
}`,
        response: `{
  items: Patient[],
  total: number
}`,
      },
      {
        name: "patients.search",
        method: "GET",
        description:
          tx("Quick search by patient, owner, or breed. Returns up to 10 deterministically ordered results."),
        input: `{ query: string }`,
        response: `Patient[]`,
      },
      {
        name: "patients.getById",
        method: "GET",
        description:
          tx("Get full patient details including weights, allergies, and owner info."),
        input: `{ id: string }`,
        response: `{
  ...Patient,
  weights: Weight[],
  allergies: Allergy[],
  ownerName: string
}`,
      },
      {
        name: "patients.create",
        method: "POST",
        description: tx("Create a new patient record."),
        input: `{
  clientId: string,
  name: string,
  species: string,
  breed?: string,
  color?: string,
  sex: "male" | "female" | "male_neutered" | "female_spayed" | "unknown",
  dateOfBirth?: string,
  microchipId?: string
}`,
        response: `Patient`,
      },
      {
        name: "patients.update",
        method: "POST",
        description: tx("Update an existing patient record."),
        input: `{
  id: string,
  name?: string,
  species?: string,
  breed?: string,
  color?: string,
  sex?: string,
  dateOfBirth?: string,
  microchipId?: string,
  status?: string
}`,
        response: `Patient`,
      },
      {
        name: "patients.delete",
        method: "POST",
        description: tx("Soft-delete a patient record."),
        input: `{ id: string }`,
        response: `{ success: true }`,
      },
      {
        name: "patients.addWeight",
        method: "POST",
        description: tx("Record a weight measurement."),
        input: `{
  patientId: string,
  weight: number,
  unit: string
}`,
        response: `Weight`,
      },
      {
        name: "patients.addAllergy",
        method: "POST",
        description: tx("Record a known allergy."),
        input: `{
  patientId: string,
  allergen: string,
  severity?: string,
  notes?: string
}`,
        response: `Allergy`,
      },
    ],
  },
  {
    id: "appointments",
    title: tx("Appointments"),
    description: tx("Schedule and manage appointments."),
    endpoints: [
      {
        name: "appointments.list",
        method: "GET",
        description: tx("List appointments within a date range."),
        input: `{
  startDate: string,  // ISO date
  endDate: string,    // ISO date
  doctorId?: string,
  locationId?: string
}`,
        response: `Appointment[]`,
      },
      {
        name: "appointments.getById",
        method: "GET",
        description: tx("Get full appointment details."),
        input: `{ id: string }`,
        response: `Appointment`,
      },
      {
        name: "appointments.create",
        method: "POST",
        description: tx("Schedule a new appointment."),
        input: `{
  patientId: string,
  clientId: string,
  typeId: string,
  doctorId: string,
  locationId?: string, // required when the clinic has multiple locations unless room/provider identifies one
  roomId?: string,
  startTime: string,    // ISO datetime
  endTime: string,      // ISO datetime
  notes?: string,
  reason?: string
}`,
        response: `Appointment`,
      },
      {
        name: "appointments.updateStatus",
        method: "POST",
        description:
          tx("Update appointment status (e.g., confirm, check in, exam, check out, cancel)."),
        input: `{
  id: string,
  status: "scheduled" | "confirmed" | "checked_in" | "in_exam" | "checked_out" | "no_show" | "cancelled"
}`,
        response: `Appointment`,
      },
      {
        name: "appointments.listTypes",
        method: "GET",
        description: tx("List available appointment types for the practice."),
        response: `AppointmentType[]`,
      },
      {
        name: "appointments.listDoctors",
        method: "GET",
        description: tx("List veterinarians available for scheduling."),
        response: `Doctor[]`,
      },
      {
        name: "appointments.listLocations",
        method: "GET",
        description: tx("List active clinic locations available for scheduling."),
        response: `Array<{ id: string, name: string, address: string | null, phone: string | null, isPrimary: boolean }>`,
      },
      {
        name: "appointments.listRooms",
        method: "GET",
        description: tx("List exam rooms, optionally for one clinic location."),
        input: `{ locationId?: string }`,
        response: `Room[]`,
      },
    ],
  },
  {
    id: "records",
    title: tx("Medical Records"),
    description:
      tx("SOAP notes, vaccinations, lab results, procedures, problems, and prescriptions."),
    endpoints: [
      {
        name: "records.listSoapNotes",
        method: "GET",
        description: tx("List SOAP notes for a patient."),
        input: `{ patientId: string }`,
        response: `SoapNote[]`,
      },
      {
        name: "records.createSoapNote",
        method: "POST",
        description:
          tx("Create an immediately finalized, immutable SOAP note for an active in-exam appointment. Conflicts with an existing draft or effective finalized note."),
        input: `{
  patientId: string,
  appointmentId: string,
  subjective: string,
  objective: string,
  assessment: string,
  plan: string
}`,
        response: `SoapNote`,
      },
      {
        name: "records.listVaccinations",
        method: "GET",
        description: tx("List vaccination records for a patient."),
        input: `{ patientId: string }`,
        response: `Vaccination[]`,
      },
      {
        name: "records.createVaccination",
        method: "POST",
        description: tx("Record a vaccination."),
        input: `{
  patientId: string,
  vaccineName: string,
  manufacturer?: string,
  lotNumber?: string,
  expirationDate?: string,
  nextDueDate?: string,
  notes?: string
}`,
        response: `Vaccination`,
      },
      {
        name: "records.listLabResults",
        method: "GET",
        description: tx("List lab results for a patient."),
        input: `{ patientId: string }`,
        response: `LabResult[]`,
      },
      {
        name: "records.createLabResult",
        method: "POST",
        description: tx("Create a lab result entry."),
        input: `{
  patientId: string,
  testName: string,
  category?: string,
  results?: object,
  notes?: string
}`,
        response: `LabResult`,
      },
      {
        name: "records.updateLabResultStatus",
        method: "POST",
        description: tx("Update the status of a lab result."),
        input: `{
  id: string,
  status: "pending" | "completed" | "reviewed"
}`,
        response: `LabResult`,
      },
      {
        name: "records.listProcedures",
        method: "GET",
        description: tx("List procedures performed on a patient."),
        input: `{ patientId: string }`,
        response: `Procedure[]`,
      },
      {
        name: "records.createProcedure",
        method: "POST",
        description: tx("Record a procedure."),
        input: `{
  patientId: string,
  name: string,
  description?: string,
  notes?: string
}`,
        response: `Procedure`,
      },
      {
        name: "records.listProblems",
        method: "GET",
        description: tx("List active and resolved problems for a patient."),
        input: `{ patientId: string }`,
        response: `Problem[]`,
      },
      {
        name: "records.createProblem",
        method: "POST",
        description: tx("Add a problem to the patient's problem list."),
        input: `{
  patientId: string,
  description: string,
  severity?: string,
  notes?: string
}`,
        response: `Problem`,
      },
      {
        name: "records.updateProblemStatus",
        method: "POST",
        description: tx("Mark a problem as resolved or reactivate it."),
        input: `{
  id: string,
  status: "active" | "resolved"
}`,
        response: `Problem`,
      },
      {
        name: "records.listPrescriptions",
        method: "GET",
        description: tx("List prescriptions for a patient."),
        input: `{ patientId: string }`,
        response: `Prescription[]`,
      },
      {
        name: "records.createPrescription",
        method: "POST",
        description: tx("Create a prescription."),
        input: `{
  patientId: string,
  medicationName: string,
  dosage: string,
  frequency: string,
  startDate: string,
  endDate?: string,
  quantity?: number,
  productId?: string,
  refillsRemaining?: number,
  instructions?: string,
  acknowledgeSafetyWarnings?: boolean
}`,
        response: `Prescription`,
      },
    ],
  },
  {
    id: "billing",
    title: tx("Billing"),
    description: tx("Invoices, payments, services, and estimates."),
    endpoints: [
      {
        name: "billing.listInvoices",
        method: "GET",
        description: tx("List invoices with optional filters."),
        input: `{
  status?: string,
  isEstimate?: boolean,
  limit?: number,
  offset?: number
}`,
        response: `{
  items: Invoice[],
  total: number
}`,
      },
      {
        name: "billing.getInvoice",
        method: "GET",
        description: tx("Get full invoice with line items and payments."),
        input: `{ id: string }`,
        response: `{
  ...Invoice,
  items: InvoiceItem[],
  payments: Payment[]
}`,
      },
      {
        name: "billing.createInvoice",
        method: "POST",
        description: tx("Create an invoice or estimate."),
        input: `{
  clientId: string,
  patientId?: string,
  isEstimate?: boolean,
  items: {
    serviceId?: string,
    productId?: string,
    description: string,
    quantity: number,
    unitPrice: number
  }[],
  notes?: string
}`,
        response: `Invoice`,
      },
      {
        name: "billing.updateInvoiceStatus",
        method: "POST",
        description:
          tx("Update a workflow status. Paid is derived from recorded payments or adjustments and cannot be set directly."),
        input: `{
  id: string,
  status: "draft" | "sent" | "overdue" | "void"
}`,
        response: `Invoice`,
      },
      {
        name: "billing.convertEstimateToInvoice",
        method: "POST",
        description: tx("Convert an approved estimate into a billable invoice."),
        input: `{ id: string }`,
        response: `Invoice`,
      },
      {
        name: "billing.recordPayment",
        method: "POST",
        description: tx("Record a payment against an invoice."),
        input: `{
  invoiceId: string,
  amount: number,
  method: "cash" | "credit_card" | "debit_card" | "check" | "online" | "other",
  notes?: string
}`,
        response: `Payment`,
      },
      {
        name: "billing.createCardPaymentCheckout",
        method: "POST",
        description:
          tx("Create a Stripe Checkout link for the remaining adjusted invoice balance."),
        input: `{ invoiceId: string }`,
        response: `{ url: string }`,
      },
      {
        name: "billing.listPayments",
        method: "GET",
        description: tx("List payments for an invoice."),
        input: `{ invoiceId: string }`,
        response: `Payment[]`,
      },
      {
        name: "billing.listAdjustments",
        method: "GET",
        description: tx("List credits and write-offs for an invoice."),
        input: `{ invoiceId: string }`,
        response: `InvoiceAdjustment[]`,
      },
      {
        name: "billing.applyInvoiceAdjustment",
        method: "POST",
        description: tx("Apply a credit or write-off to an invoice balance."),
        input: `{
  invoiceId: string,
  type: "credit" | "write_off",
  amount: number,
  reason?: string
}`,
        response: `InvoiceAdjustment`,
      },
      {
        name: "billing.voidInvoice",
        method: "POST",
        description: tx("Void an invoice with no payment or adjustment history."),
        input: `{ id: string }`,
        response: `Invoice`,
      },
      {
        name: "billing.listServices",
        method: "GET",
        description: tx("List all services offered by the practice."),
        response: `Service[]`,
      },
      {
        name: "billing.listArchivedServices",
        method: "GET",
        description: tx("List archived services for administrator recovery."),
        response: `Service[]`,
      },
      {
        name: "billing.createService",
        method: "POST",
        description: tx("Create a service in the practice charge catalog."),
        input: `{ name: string, code?: string, category?: string, defaultPrice: string }`,
        response: `Service`,
      },
      {
        name: "billing.updateService",
        method: "POST",
        description:
          tx("Update a service if its browser version is still current."),
        input: `{ id: string, expected: { name: string, code?: string, category?: string, defaultPrice: string }, name: string, code?: string, category?: string, defaultPrice: string }`,
        response: `Service`,
      },
      {
        name: "billing.archiveService",
        method: "POST",
        description:
          tx("Remove a service from future charge pickers without changing historical invoices."),
        input: `{ id: string, expected: { name: string, code?: string, category?: string, defaultPrice: string } }`,
        response: `{ success: true }`,
      },
      {
        name: "billing.restoreService",
        method: "POST",
        description: tx("Restore an archived service to future charge pickers."),
        input: `{ id: string, expected: { name: string, code?: string, category?: string, defaultPrice: string } }`,
        response: `{ success: true }`,
      },
      {
        name: "billing.listProducts",
        method: "GET",
        description: tx("List products available for invoicing."),
        response: `Product[]`,
      },
    ],
  },
  {
    id: "portal",
    title: tx("Client Portal"),
    description:
      tx("Token-based public access for pet owners. No session required -- uses a unique access token per client."),
    endpoints: [
      {
        name: "portal.getClient",
        method: "GET",
        description: tx("Get client profile and pets via portal token."),
        input: `{ token: string }`,
        response: `{
  client: Client,
  pets: Patient[],
  locations: Array<{ id: string, name: string, address: string | null, phone: string | null, isPrimary: boolean }>
}`,
        auth: "Portal token",
      },
      {
        name: "portal.getPetDetail",
        method: "GET",
        description: tx("Get full pet details including medical history."),
        input: `{
  token: string,
  patientId: string
}`,
        response: `{
  ...Patient,
  vaccinations: Vaccination[],
  prescriptions: Prescription[],
  weights: Weight[],
  allergies: Allergy[]
}`,
        auth: "Portal token",
      },
      {
        name: "portal.getAppointments",
        method: "GET",
        description: tx("List upcoming appointments for the client."),
        input: `{ token: string }`,
        response: `Appointment[]`,
        auth: "Portal token",
      },
      {
        name: "portal.getInvoices",
        method: "GET",
        description: tx("List invoices for the client."),
        input: `{ token: string }`,
        response: `Invoice[]`,
        auth: "Portal token",
      },
      {
        name: "portal.getMessages",
        method: "GET",
        description: tx("List portal messages for the client."),
        input: `{ token: string }`,
        response: `{
  timezone: string | null,
  items: Array<{
    id: string,
    direction: "inbound" | "outbound",
    subject: string | null,
    content: string | null,
    status: string,
    readAt: Date | null,
    createdAt: Date | null
  }>
}`,
        auth: "Portal token",
      },
      {
        name: "portal.createMessage",
        method: "POST",
        description:
          tx("Send a portal message from the client into the shared inbox."),
        input: `{
  token: string,
  content: string
}`,
        response: `{ success: true, message: Communication }`,
        auth: "Portal token",
      },
      {
        name: "portal.markMessagesRead",
        method: "POST",
        description:
          tx("Mark outbound clinic portal messages as read after the client opens the thread."),
        input: `{ token: string }`,
        response: `{ success: true, updated: number }`,
        auth: "Portal token",
      },
      {
        name: "portal.getAppointmentTypes",
        method: "GET",
        description: tx("List appointment types available for portal booking."),
        input: `{ token: string }`,
        response: `Array<{ id: string, name: string, durationMinutes: number, requiresDoctor: number }>`,
        auth: "Portal token",
      },
      {
        name: "portal.availableSlots",
        method: "GET",
        description: tx("List suggested open times for a portal booking date."),
        input: `{
  token: string,
  date: string, // YYYY-MM-DD
  typeId?: string, // uses the verified type duration and provider coverage
  locationId?: string, // required when the clinic has multiple locations
  durationMinutes?: number // legacy fallback when typeId is omitted
}`,
        response: `Array<{ time: string, iso: string }>`,
        auth: "Portal token",
      },
      {
        name: "portal.requestAppointment",
        method: "POST",
        description:
          tx("Submit an appointment request from the portal using an exact requested time."),
        input: `{
  token: string,
  patientId: string,
  typeId: string,
  locationId?: string, // required when the clinic has multiple locations
  reason: string,
  preferredDate: string, // YYYY-MM-DD
  preferredTime: string // 24-hour HH:MM
}`,
        response: `{ success: true, appointmentId: string, message: string }`,
        auth: "Portal token",
      },
    ],
  },
  {
    id: "apiKeys",
    title: tx("API Keys"),
    description:
      tx("Admin-only API key management for server-to-server integrations. Raw keys are returned once at creation."),
    endpoints: [
      {
        name: "apiKeys.list",
        method: "GET",
        description: tx("List active API keys for the practice."),
        response: `Array<{
  id: string,
  name: string,
  keyPrefix: string,
  scopes: ApiScope[],
  lastUsedAt: string | null,
  createdAt: string
}>`,
        auth: "Admin only",
      },
      {
        name: "apiKeys.create",
        method: "POST",
        description:
          tx("Create an API key for REST integrations. The raw key is returned once and is never stored in plaintext. The agent:write scope must be paired with agent:run or *."),
        input: `{
  name: string,
  scopes: Array<"clients:read" | "patients:read" | "appointments:read" | "appointments:write" | "records:write" | "agent:run" | "agent:write" | "*">
}`,
        response: `{ ...ApiKey, key: string }`,
        auth: "Admin only",
      },
      {
        name: "apiKeys.revoke",
        method: "POST",
        description: tx("Revoke an API key."),
        input: `{ id: string }`,
        response: `{ success: true }`,
        auth: "Admin only",
      },
    ],
  },
  {
    id: "restApi",
    title: tx("REST API"),
    description:
      "API-key authenticated /api/v1 endpoints for external integrations. Send Authorization: Bearer <api-key>.",
    endpoints: [
      {
        name: "GET /api/v1/clients",
        method: "GET",
        description: tx("List clients for the authenticated practice."),
        input: `?limit=25&offset=0`,
        response: `{ data: Client[], pagination: Pagination }`,
        auth: "API key: clients:read",
      },
      {
        name: "GET /api/v1/clients/:id",
        method: "GET",
        description: tx("Fetch a single client."),
        response: `{ data: Client }`,
        auth: "API key: clients:read",
      },
      {
        name: "GET /api/v1/patients",
        method: "GET",
        description: tx("List patients, optionally filtered by client."),
        input: `?client_id=uuid&limit=25&offset=0`,
        response: `{ data: Patient[], pagination: Pagination }`,
        auth: "API key: patients:read",
      },
      {
        name: "GET /api/v1/patients/:id",
        method: "GET",
        description: tx("Fetch a single patient."),
        response: `{ data: Patient }`,
        auth: "API key: patients:read",
      },
      {
        name: "GET /api/v1/appointments",
        method: "GET",
        description:
          tx("List appointments, optionally filtered by client, patient, clinic location, status, or start-time window. Date-only filters use UTC day bounds."),
        input: `?client_id=uuid&patient_id=uuid&location_id=uuid&status=scheduled&from=YYYY-MM-DD-or-ISO-timestamp&to=YYYY-MM-DD-or-ISO-timestamp&limit=25&offset=0`,
        response: `{ data: Appointment[], pagination: Pagination }`,
        auth: "API key: appointments:read",
      },
      {
        name: "GET /api/v1/appointments/:id",
        method: "GET",
        description: tx("Fetch a single appointment."),
        response: `{ data: Appointment }`,
        auth: "API key: appointments:read",
      },
      {
        name: "POST /api/v1/appointments",
        method: "POST",
        description:
          tx("Create an appointment and emit the appointment.created webhook with camelCase appointment fields."),
        input: `{
  client_id?: string,
  patient_id?: string,
  doctor_id?: string,
  type_id?: string,
  location_id?: string, // required when multiple locations and no room/provider resolves one
  room_id?: string,
  start_time: string, // timezone-qualified ISO timestamp
  end_time: string,   // timezone-qualified ISO timestamp
  notes?: string
}`,
        response: `{ data: Appointment }`,
        auth: "API key: appointments:write",
      },
      {
        name: "POST /api/v1/soap-notes",
        method: "POST",
        description:
          tx("Create an immediately finalized, immutable SOAP note for an external AI scribe during an active in-exam appointment and emit the soap_note.created webhook. Returns a conflict when the encounter already has a draft or effective finalized note."),
        input: `{
  patient_id: string,
  appointment_id: string,
  author_id?: string,
  subjective?: string,
  objective?: string,
  assessment?: string,
  plan?: string,
  source: string
}`,
        response: `{ data: SoapNote }`,
        auth: "API key: records:write",
      },
      {
        name: "POST /api/v1/agent",
        method: "POST",
        description:
          tx("Run the OpenVPM Agent from an external automation. Instruction text is trimmed and must be nonblank. Cloud trials require signed Stripe billing-setup evidence before AI is enabled; the rest of the free trial remains available. Write-enabled runs require agent:write plus each write tool's resource scope."),
        input: `{
  instruction: string,
  allow_writes?: boolean
}`,
        response: `{ data: AgentRunResult }`,
        auth: "API key: agent:run; agent:write plus resource write scopes when allow_writes=true",
      },
    ],
  },
  {
    id: "webhooks",
    title: tx("Webhooks"),
    description:
      tx("Subscribe to real-time events. Webhook payloads are signed with HMAC-SHA256 using the secret provided at creation."),
    endpoints: [
      {
        name: "webhooks.list",
        method: "GET",
        description: tx("List all webhooks for the practice."),
        response: `Webhook[]`,
        auth: "Admin only",
      },
      {
        name: "webhooks.create",
        method: "POST",
        description:
          tx("Create a webhook subscription. The secret is returned once and cannot be retrieved again."),
        input: `{
  url: string,
  events: WebhookEvent[]
}`,
        response: `{
  ...Webhook,
  secret: string   // shown once
}`,
        auth: "Admin only",
      },
      {
        name: "webhooks.toggle",
        method: "POST",
        description: tx("Enable or disable a webhook."),
        input: `{ id: string }`,
        response: `Webhook`,
        auth: "Admin only",
      },
      {
        name: "webhooks.delete",
        method: "POST",
        description: tx("Delete a webhook subscription."),
        input: `{ id: string }`,
        response: `{ success: true }`,
        auth: "Admin only",
      },
    ],
  },
  {
    id: "inventory",
    title: tx("Inventory"),
    description: tx("Track products, stock levels, and suppliers."),
    endpoints: [
      {
        name: "inventory.list",
        method: "GET",
        description: tx("List inventory items with optional filters."),
        input: `{
  search?: string,
  category?: string,
  alert?: "all" | "attention" | "low_stock" | "expired" | "expiring_soon",
  limit?: number,
  offset?: number
}`,
        response: `{
  items: Array<InventoryItem & {
    stockStatus: "not_tracked" | "ok" | "low" | "out",
    expirationStatus: "ok" | "expired" | "expiring_soon"
  }>,
  total: number,
  alertCounts: {
    attention: number,
    lowStock: number,
    expired: number,
    expiringSoon: number
  }
}`,
      },
      {
        name: "inventory.create",
        method: "POST",
        description: tx("Add a new inventory item."),
        input: `{
  name: string,
  sku?: string,
  category?: string,
  unitPrice: string,
  costPrice?: string,
  stockQuantity?: number,
  reorderPoint?: number,
  lotNumber?: string,
  expirationDate?: "YYYY-MM-DD"
}`,
        response: `InventoryItem`,
      },
      {
        name: "inventory.update",
        method: "POST",
        description:
          tx("Update inventory item metadata. Use inventory.adjustStock for stock quantity changes so every movement has a reason."),
        input: `{
  id: string,
  name?: string,
  sku?: string,
  category?: string,
  unitPrice?: string,
  costPrice?: string,
  reorderPoint?: number,
  lotNumber?: string,
  expirationDate?: "YYYY-MM-DD" | null
}`,
        response: `InventoryItem`,
      },
      {
        name: "inventory.adjustStock",
        method: "POST",
        description: tx("Adjust stock quantity (positive or negative)."),
        input: `{
  id: string,
  adjustment: number,
  reason: string
}`,
        response: `InventoryItem`,
      },
      {
        name: "inventory.listSuppliers",
        method: "GET",
        description: tx("List all suppliers."),
        response: `Supplier[]`,
      },
      {
        name: "inventory.createSupplier",
        method: "POST",
        description: tx("Add a new supplier."),
        input: `{
  name: string,
  contactEmail?: string,
  phone?: string,
  address?: string,
  notes?: string
}`,
        response: `Supplier`,
      },
      {
        name: "inventory.updateSupplier",
        method: "POST",
        description: tx("Update supplier contact details."),
        input: `{
  id: string,
  name?: string,
  contactEmail?: string | null,
  phone?: string | null,
  address?: string | null,
  notes?: string | null
}`,
        response: `Supplier`,
      },
    ],
  },
  {
    id: "reports",
    title: tx("Reports"),
    description: tx("Run practice analytics over configurable date ranges."),
    endpoints: [
      {
        name: "reports.revenue",
        method: "GET",
        description:
          tx("Revenue totals, previous-period comparison, and daily revenue for a selected range."),
        input: `{
  startDate?: "YYYY-MM-DD",
  endDate?: "YYYY-MM-DD"
}`,
        response: `{
  range: ReportDateRange,
  total: number,
  previousTotal: number,
  daily: Array<{ date: string, amount: number }>
}`,
      },
      {
        name: "reports.appointments",
        method: "GET",
        description:
          tx("Appointment KPIs and doctor breakdown for a selected range."),
        input: `{
  startDate?: "YYYY-MM-DD",
  endDate?: "YYYY-MM-DD"
}`,
        response: `{
  range: ReportDateRange,
  total: number,
  completed: number,
  noShows: number,
  cancelled: number,
  fillRate: number,
  byDoctor: Array<{ doctorName: string, total: number, completed: number }>
}`,
      },
      {
        name: "reports.topServices",
        method: "GET",
        description:
          tx("Top billed service items by count and revenue for a selected range."),
        input: `{
  startDate?: "YYYY-MM-DD",
  endDate?: "YYYY-MM-DD"
}`,
        response: `{
  range: ReportDateRange,
  items: Array<{ name: string, count: number, revenue: number }>
}`,
      },
      {
        name: "reports.inventoryAlerts",
        method: "GET",
        description: tx("Current low-stock, expired, and expiring-product alerts."),
        response: `{
  lowStock: Product[],
  expired: Product[],
  expiringSoon: Product[]
}`,
      },
    ],
  },
  {
    id: "settings",
    title: tx("Settings"),
    description: tx("Admin-only practice configuration endpoints."),
    endpoints: [
      {
        name: "settings.listLocations",
        method: "GET",
        description: tx("List active practice locations."),
        response: `Array<{
  id: string,
  name: string,
  address: string | null,
  phone: string | null,
  isPrimary: boolean
}>`,
        auth: "Admin only",
      },
      {
        name: "settings.createLocation",
        method: "POST",
        description:
          tx("Create a practice location and sync hosted billing quantities."),
        input: `{
  name: string,
  address?: string,
  phone?: string,
  isPrimary?: boolean
}`,
        response: `Location`,
        auth: "Admin only",
      },
      {
        name: "settings.updateLocation",
        method: "POST",
        description: tx("Update a tenant-scoped location."),
        input: `{
  id: string,
  name?: string,
  address?: string,
  phone?: string
}`,
        response: `Location`,
        auth: "Admin only",
      },
      {
        name: "settings.setPrimaryLocation",
        method: "POST",
        description: tx("Make one active tenant location the primary location."),
        input: `{ id: string }`,
        response: `Location`,
        auth: "Admin only",
      },
      {
        name: "settings.deleteLocation",
        method: "POST",
        description:
          tx("Retire a location, disable its texting setup, preserve at least one active location, and sync hosted billing quantities."),
        input: `{ id: string }`,
        response: `{ success: true }`,
        auth: "Admin only",
      },
    ],
  },
  {
    id: "communications",
    title: tx("Communications"),
    description: tx("Track client communications across channels."),
    endpoints: [
      {
        name: "communications.list",
        method: "GET",
        description:
          tx("List communications with optional filters. The sent inbox filter includes sent, delivered, and read outbound messages."),
        input: `{
  clientId?: string,
  status?: string,
  inboxFilter?: "all" | "unread" | "sent",
  limit?: number,
  offset?: number
}`,
        response: `{
  items: Array<Communication & {
    readAt: Date | null,
    providerMessageId: string | null,
    assignedToName: string | null
  }>,
  total: number
}`,
      },
      {
        name: "communications.listConversations",
        method: "GET",
        description:
          tx("List one latest message per shared-inbox conversation, with unread counts derived server-side. The sent inbox filter includes sent, delivered, and read outbound conversations."),
        input: `{
  inboxFilter?: "all" | "unread" | "sent",
  limit?: number,
  offset?: number
}`,
        response: `{
  items: Array<Communication & {
    readAt: Date | null,
    providerMessageId: string | null,
    assignedToName: string | null,
    unreadCount: number
  }>,
  total: number
}`,
      },
      {
        name: "communications.getByClient",
        method: "GET",
        description: tx("Get all communications for a specific client."),
        input: `{ clientId: string }`,
        response: `Array<Communication & {
  readAt: Date | null,
  providerMessageId: string | null,
  assignedToName: string | null
}>`,
      },
      {
        name: "communications.markClientRead",
        method: "POST",
        description:
          tx("Mark unread inbound messages for a client thread as read."),
        input: `{ clientId: string }`,
        response: `{ ok: true, updated: number }`,
      },
      {
        name: "communications.assignClient",
        method: "POST",
        description:
          tx("Assign or unassign a client conversation in the shared inbox."),
        input: `{
  clientId: string,
  action: "assign_to_me" | "unassign",
  expectedAssignedTo: string | null
}`,
        response: `{
  ok: true,
  assignedTo: string | null,
  assignedToName: string | null,
  updated: number
}`,
      },
      {
        name: "communications.linkCommunicationToClient",
        method: "POST",
        description:
          tx("Link an unmatched inbound inbox message to a tenant client."),
        input: `{
  communicationId: string,
  clientId: string
}`,
        response: `{
  ok: true,
  communicationId: string,
  clientId: string,
  assignedTo: string | null,
  assignedToName: string | null
}`,
      },
      {
        name: "communications.create",
        method: "POST",
        description:
          tx("Send outbound SMS/email from the inbox, or send/log internal portal communications visible in the client portal."),
        input: `{
  clientId: string,
  channel: "phone" | "sms" | "email" | "portal",
  direction: "inbound" | "outbound",
  subject?: string,
  content: string,
  status?: "pending" | "sent" | "delivered" | "read" | "failed",
  requestId?: string // Required UUID for outbound SMS/email; reuse for retries of the same send.
}`,
        response: `Communication`,
      },
      {
        name: "communications.updateStatus",
        method: "POST",
        description:
          tx("Mark one unread inbound communication as read. Delivery lifecycle statuses are managed by send and provider webhook handlers."),
        input: `{
  id: string,
  status: "read"
}`,
        response: `Communication`,
      },
    ],
  },
];

// ── Components ───────────────────────────────────────────────

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
        method === "GET"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }`}
    >
      {method}
    </span>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {endpoint.name}
        </code>
        {endpoint.auth && endpoint.auth !== "Session cookie" && (
          <span className="ml-auto rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {endpoint.auth}
          </span>
        )}
      </div>
      <div className="space-y-3 px-4 py-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {endpoint.description}
        </p>
        {endpoint.input && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{tx("Input")}</p>
            <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {endpoint.input}
            </pre>
          </div>
        )}
        {endpoint.response && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{tx("Response")}</p>
            <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {endpoint.response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <nav className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400">{tx("OpenVPM API")}</h2>
          <p className="text-xs text-slate-500">{tx("v1.0 Reference")}</p>
        </div>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {s.title}
                <span className="ml-1 text-xs text-slate-400">
                  ({s.endpoints.length})
                </span>
              </a>
            </li>
          ))}
          <li>
            <a
              href="#webhook-events"
              className="block rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >{tx("Webhook Events")}</a>
          </li>
        </ul>

        <div className="mt-8 border-t border-slate-200 pt-4 dark:border-slate-700">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{tx("Base URL")}</h3>
          <code className="block rounded bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            /api/trpc/ + /api/v1/
          </code>
          <p className="mt-3 text-xs text-slate-500">{tx("Dashboard procedures use tRPC under")}{" "}<code>/api/trpc</code>{tx(". External integrations use API-key REST endpoints under")}{" "}<code>/api/v1</code>.
          </p>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tx("OpenVPM API Reference")}</h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{tx("Complete API documentation for the OpenVPM veterinary practice management system. The dashboard API uses tRPC, client portal flows use portal tokens, and external integrations use API keys with REST endpoints under")}{" "}<code>/api/v1</code>.
            </p>

            {/* Quick info cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{tx("Authentication")}</h3>
                <p className="mt-1 text-xs text-slate-500">{tx("Dashboard calls use NextAuth session cookies, portal flows use client tokens, and REST integrations use API keys.")}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{tx("Multi-tenancy")}</h3>
                <p className="mt-1 text-xs text-slate-500">{tx("All data is scoped to the authenticated user's practice. No cross-practice data access is possible.")}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{tx("Real-time Events")}</h3>
                <p className="mt-1 text-xs text-slate-500">{tx("Subscribe to the live webhook catalog. Events are HMAC signed with each subscription secret.")}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-12">
              <div className="mb-4 border-b border-slate-200 pb-2 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {section.description}
                </p>
              </div>
              <div className="space-y-4">
                {section.endpoints.map((ep) => (
                  <EndpointCard key={ep.name} endpoint={ep} />
                ))}
              </div>
            </section>
          ))}

          {/* Webhook Events Reference */}
          <section id="webhook-events" className="mb-12">
            <div className="mb-4 border-b border-slate-200 pb-2 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tx("Webhook Events")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tx("Available event types for webhook subscriptions. Payloads are signed with HMAC-SHA256 using the webhook secret.")}</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{tx("Event")}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{tx("Description")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800/50">
                  {WEBHOOK_EVENT_DEFINITIONS.map((ev) => (
                    <tr key={ev.event}>
                      <td className="px-4 py-2">
                        <code className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          {ev.event}
                        </code>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                        {ev.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payload example */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{tx("Webhook Payload Format")}</h3>
              <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {`POST https://your-server.com/webhook
Content-Type: application/json
X-Webhook-Event: appointment.created
X-Webhook-Signature: <hmac-sha256-hex>

{
  "event": "appointment.created",
  "timestamp": "2026-03-17T14:30:00Z",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "clientId": "uuid",
    "locationId": "uuid",
    "startTime": "2026-03-18T09:00:00Z",
    "status": "scheduled"
  }
}`}
              </pre>
            </div>

            {/* Signature verification */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{tx("Verifying Signatures")}</h3>
              <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {`import crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
              </pre>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-sm text-slate-500 dark:border-slate-700">
            <p>{tx("OpenVPM — Open-source veterinary practice management.")}</p>
            <p className="mt-1">{tx("API questions? Check the")}{" "}
              <a
                href="https://github.com/evangauer/openvpm"
                className="text-teal-600 hover:underline dark:text-teal-400"
              >{tx("GitHub repository")}</a>{" "}{tx("or open an issue.")}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
