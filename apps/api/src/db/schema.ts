import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const auditFields = () => ({
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date()),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  // passwordHash = "<iterations>:<saltHex>:<hashHex>" จาก PBKDF2-SHA256 (Web Crypto)
  // NULL สำหรับ user ที่ login ผ่าน Google เท่านั้น (ไม่เคยตั้ง local password)
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date()),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    userIdx: index("accounts_user_idx").on(t.userId),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  { identifier: text("identifier").notNull(), token: text("token").notNull(), expires: integer("expires", { mode: "timestamp" }).notNull() },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) })
);

export const systemRoles = sqliteTable("system_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleName: text("role_name").notNull(),
  module: text("module", { enum: ["PM", "RENTALS", "GLOBAL"] }).notNull(),
  permissions: text("permissions", { mode: "json" }).$type<Record<string, boolean>>().notNull().$defaultFn(() => ({})),
  ...auditFields(),
});

export const userRoles = sqliteTable(
  "user_roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id").notNull().references(() => systemRoles.id, { onDelete: "cascade" }),
    ...auditFields(),
  },
  (t) => ({ uniqUserRole: uniqueIndex("user_roles_user_role_uniq").on(t.userId, t.roleId) })
);

export const themes = sqliteTable("themes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  ...auditFields(),
});

export const initiatives = sqliteTable("initiatives", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  themeId: integer("theme_id").notNull().references(() => themes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  ...auditFields(),
});

export const requirements = sqliteTable("requirements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  initiativeId: integer("initiative_id").notNull().references(() => initiatives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  ...auditFields(),
});

export const priorities = sqliteTable("priorities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  color: text("color"),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requirementId: integer("requirement_id").notNull().references(() => requirements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status"),
  priorityId: integer("priority_id").references(() => priorities.id, { onDelete: "set null" }),
  ...auditFields(),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status"),
  themeId: integer("theme_id").references(() => themes.id, { onDelete: "set null" }),
  ...auditFields(),
});

export const features = sqliteTable("features", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status"),
  ...auditFields(),
});

export const workflowStatuses = sqliteTable(
  "workflow_statuses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    category: text("category", { enum: ["todo", "doing", "done"] }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...auditFields(),
  },
  (t) => ({ projectIdx: index("workflow_statuses_project_idx").on(t.projectId) })
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    workflowStatusId: integer("workflow_status_id").notNull().references(() => workflowStatuses.id, { onDelete: "restrict" }),
    startDate: integer("start_date", { mode: "timestamp" }),
    dueDate: integer("due_date", { mode: "timestamp" }),
    estimatedHours: real("estimated_hours"),
    budgetCost: real("budget_cost"),
    ...auditFields(),
  },
  (t) => ({
    featureIdx: index("tasks_feature_idx").on(t.featureId),
    statusIdx: index("tasks_status_idx").on(t.workflowStatusId),
    assigneeIdx: index("tasks_assignee_idx").on(t.assigneeId),
  })
);

export const customFields = sqliteTable("custom_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type", { enum: ["task", "project", "feature"] }).notNull(),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type", { enum: ["text", "number", "date", "select", "checkbox"] }).notNull(),
  fieldOptions: text("field_options", { mode: "json" }).$type<Record<string, unknown>>(),
  ...auditFields(),
});

export const customFieldValues = sqliteTable(
  "custom_field_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customFieldId: integer("custom_field_id").notNull().references(() => customFields.id, { onDelete: "cascade" }),
    entityId: integer("entity_id").notNull(),
    value: text("value"),
    ...auditFields(),
  },
  (t) => ({
    uniqFieldEntity: uniqueIndex("custom_field_values_field_entity_uniq").on(t.customFieldId, t.entityId),
    entityIdx: index("custom_field_values_entity_idx").on(t.entityId),
  })
);

export const taskWorklogs = sqliteTable(
  "task_worklogs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    workDate: integer("work_date", { mode: "timestamp" }).notNull(),
    hoursSpent: real("hours_spent").notNull(),
    note: text("note"),
    ...auditFields(),
  },
  (t) => ({ taskIdx: index("task_worklogs_task_idx").on(t.taskId) })
);

export const issues = sqliteTable("issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  ...auditFields(),
});

export const risks = sqliteTable("risks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  probability: text("probability", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  impact: text("impact", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  mitigationPlan: text("mitigation_plan"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  ...auditFields(),
});

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type", { enum: ["task", "project", "feature", "issue", "risk"] }).notNull(),
    entityId: integer("entity_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    ...auditFields(),
  },
  (t) => ({ entityIdx: index("comments_entity_idx").on(t.entityType, t.entityId) })
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    fieldChanged: text("field_changed"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({ entityIdx: index("activity_logs_entity_idx").on(t.entityType, t.entityId) })
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type", { enum: ["task", "project", "feature", "issue"] }).notNull(),
    entityId: integer("entity_id").notNull(),
    googleDriveFileId: text("google_drive_file_id").notNull(),
    fileName: text("file_name"),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({ entityIdx: index("attachments_entity_idx").on(t.entityType, t.entityId) })
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  roles: many(userRoles),
  worklogs: many(taskWorklogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  theme: one(themes, { fields: [projects.themeId], references: [themes.id] }),
  features: many(features),
  workflowStatuses: many(workflowStatuses),
  risks: many(risks),
  issues: many(issues),
}));

export const featuresRelations = relations(features, ({ one, many }) => ({
  project: one(projects, { fields: [features.projectId], references: [projects.id] }),
  product: one(products, { fields: [features.productId], references: [products.id] }),
  tasks: many(tasks),
}));

export const workflowStatusesRelations = relations(workflowStatuses, ({ one, many }) => ({
  project: one(projects, { fields: [workflowStatuses.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  feature: one(features, { fields: [tasks.featureId], references: [features.id] }),
  workflowStatus: one(workflowStatuses, { fields: [tasks.workflowStatusId], references: [workflowStatuses.id] }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  worklogs: many(taskWorklogs),
}));

export const customFieldsRelations = relations(customFields, ({ many }) => ({ values: many(customFieldValues) }));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  field: one(customFields, { fields: [customFieldValues.customFieldId], references: [customFields.id] }),
}));

export const taskWorklogsRelations = relations(taskWorklogs, ({ one }) => ({
  task: one(tasks, { fields: [taskWorklogs.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskWorklogs.userId], references: [users.id] }),
}));
