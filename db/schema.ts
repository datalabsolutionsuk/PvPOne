import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  boolean,
  uuid,
  jsonb,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", [
  "SuperAdmin",
  "LawyerAdmin",
  "ClientAdmin",
  "ClientUser",
  "ReadOnly",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "Draft",
  "Filed",
  "Formality_Check",
  "DUS",
  "Exam",
  "Published_Opp",
  "Certificate_Issued",
  "Refused",
  "Withdrawn",
]);

// --- Auth & Multi-tenancy ---

export const organisations = pgTable("organisations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For credentials provider
  role: userRoleEnum("role").default("ClientUser").notNull(),
  organisationId: uuid("organisation_id").references(() => organisations.id, {
    onDelete: "cascade",
  }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const passwordResetTokens = pgTable(
  "passwordResetToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// --- Jurisdiction Rules Engine ---

export const jurisdictions = pgTable("jurisdictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // e.g., "EG"
  name: text("name").notNull(), // e.g., "Egypt"
  currencyCode: text("currency_code").notNull(), // e.g., "EGP"
});

export const rulesets = pgTable("rulesets", {
  id: uuid("id").defaultRandom().primaryKey(),
  jurisdictionId: uuid("jurisdiction_id")
    .notNull()
    .references(() => jurisdictions.id),
  name: text("name").notNull(), // e.g., "Egypt v1"
  version: text("version").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const ruleDocumentRequirements = pgTable("rule_document_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  rulesetId: uuid("ruleset_id")
    .notNull()
    .references(() => rulesets.id),
  docType: text("doc_type").notNull(),
  requiredBool: boolean("required_bool").default(false).notNull(),
  notes: text("notes"),
});

export const ruleDeadlines = pgTable("rule_deadlines", {
  id: uuid("id").defaultRandom().primaryKey(),
  rulesetId: uuid("ruleset_id")
    .notNull()
    .references(() => rulesets.id),
  triggerEvent: text("trigger_event").notNull(), // e.g., "FILING_DATE"
  offsetDays: integer("offset_days").notNull(),
  appliesWhenJson: jsonb("applies_when_json"), // Condition logic
});

export const ruleTerms = pgTable("rule_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  rulesetId: uuid("ruleset_id")
    .notNull()
    .references(() => rulesets.id),
  varietyType: text("variety_type").notNull(), // e.g., "Tree and Vine"
  termYears: integer("term_years").notNull(),
});

export const ruleFees = pgTable("rule_fees", {
  id: uuid("id").defaultRandom().primaryKey(),
  rulesetId: uuid("ruleset_id")
    .notNull()
    .references(() => rulesets.id),
  feeType: text("fee_type").notNull(),
  amount: integer("amount").notNull(), // Store in cents/smallest unit or handle carefully
  currencyCode: text("currency_code").notNull(),
  notes: text("notes"),
});

export const ruleAuditLog = pgTable("rule_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organisations.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id),
  rulesetVersion: text("ruleset_version"),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  ruleType: text("rule_type"),
  inputJson: jsonb("input_json"),
  outputJson: jsonb("output_json"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Core Business Entities ---

export const varieties = pgTable("varieties", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  varietyType: text("variety_type"), // e.g., "Tree", "Vine", "Field Crop"
  breederReference: text("breeder_reference"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  varietyId: uuid("variety_id")
    .notNull()
    .references(() => varieties.id),
  jurisdictionId: uuid("jurisdiction_id")
    .notNull()
    .references(() => jurisdictions.id),
  status: applicationStatusEnum("status").default("Draft").notNull(),
  filingDate: date("filing_date", { mode: "date" }),
  applicationNumber: text("application_number"),
  publicationDate: date("publication_date", { mode: "date" }),
  grantDate: date("grant_date", { mode: "date" }), // Certificate issued date
  expiryDate: date("expiry_date", { mode: "date" }), // Computed term end
  nextRenewalDate: date("next_renewal_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id),
  taskId: uuid("task_id").references(() => tasks.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "POA", "Assignment"
  storagePath: text("storage_path").notNull(),
  uploadedBy: text("uploaded_by").references(() => users.id),
  owner: text("owner"), // Free text field for tenant admin
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const applicationStatusHistory = pgTable("application_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id),
  oldStatus: applicationStatusEnum("old_status"),
  newStatus: applicationStatusEnum("new_status").notNull(),
  changedBy: text("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at", { mode: "date" }).defaultNow().notNull(),
  notes: text("notes"),
});

export const backgroundJobs = pgTable("background_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // e.g., "REMINDER_CHECK"
  status: text("status").notNull(), // "PENDING", "COMPLETED", "FAILED"
  payload: jsonb("payload"),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date", { mode: "date" }),
  status: text("status").default("PENDING").notNull(), // PENDING, COMPLETED
  type: text("type").notNull(), // DEADLINE, DOCUMENT
  owner: text("owner"), // Free text field for tenant admin
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Relations ---

import { relations } from "drizzle-orm";

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  variety: one(varieties, {
    fields: [applications.varietyId],
    references: [varieties.id],
  }),
  jurisdiction: one(jurisdictions, {
    fields: [applications.jurisdictionId],
    references: [jurisdictions.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  application: one(applications, {
    fields: [tasks.applicationId],
    references: [applications.id],
  }),
}));

export const varietiesRelations = relations(varieties, ({ many }) => ({
  applications: many(applications),
}));

export const jurisdictionsRelations = relations(jurisdictions, ({ many }) => ({
  applications: many(applications),
  rulesets: many(rulesets),
}));

export const rulesetsRelations = relations(rulesets, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [rulesets.jurisdictionId],
    references: [jurisdictions.id],
  }),
  deadlines: many(ruleDeadlines),
}));

export const ruleDeadlinesRelations = relations(ruleDeadlines, ({ one }) => ({
  ruleset: one(rulesets, {
    fields: [ruleDeadlines.rulesetId],
    references: [rulesets.id],
  }),
}));

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(), // e.g., "STRIPE_PUBLIC_KEY"
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // "Starter", "Professional", "Enterprise"
  status: text("status").notNull(), // "active", "canceled", "past_due"
  provider: text("provider").notNull(), // "stripe", "paypal"
  providerSubscriptionId: text("provider_subscription_id"), // Stripe Sub ID or PayPal Agreement ID
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // In cents
  currency: text("currency").notNull(),
  status: text("status").notNull(), // "succeeded", "failed", "pending"
  provider: text("provider").notNull(), // "stripe", "paypal"
  providerTransactionId: text("provider_transaction_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
