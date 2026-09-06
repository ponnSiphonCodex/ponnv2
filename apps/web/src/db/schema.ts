import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const audit = () => ({
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date()),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

/* ===== Auth & Users ===== */
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  companyEmail: text("company_email"),
  phone: text("phone"),
  telegramUserId: text("telegram_user_id"),
  telegramNotify: integer("telegram_notify").notNull().default(0),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  passwordHash: text("password_hash"),
  active: integer("active").notNull().default(1),
  pmRole: text("pm_role"), // PMO | Product Owner | Project Manager | Project Co-Ordinator | Working Team
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }), userIdx: index("accounts_user_idx").on(t.userId) }));

export const loginLogs = sqliteTable("login_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  authProvider: text("auth_provider"),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  success: integer("success").notNull().default(1),
  loginTime: integer("login_time", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({ userIdx: index("login_logs_user_idx").on(t.userId) }));

export const systemRoles = sqliteTable("system_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleName: text("role_name").notNull(),
  module: text("module").notNull(),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().$defaultFn(() => []),
  ...audit(),
});

export const userRoles = sqliteTable("user_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => systemRoles.id, { onDelete: "cascade" }),
  ...audit(),
}, (t) => ({ uniq: uniqueIndex("user_roles_uniq").on(t.userId, t.roleId) }));

/* ===== Master data ===== */
export const priorities = sqliteTable("priorities", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), level: integer("level").notNull().default(3), color: text("color"), ...audit() });
export const categories = sqliteTable("categories", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), color: text("color"), ...audit() });
export const tags = sqliteTable("tags", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), color: text("color"), ...audit() });

/* ===== Strategy ===== */
export const themes = sqliteTable("themes", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), description: text("description"), ...audit() });
export const initiatives = sqliteTable("initiatives", { id: integer("id").primaryKey({ autoIncrement: true }), themeId: integer("theme_id").references(() => themes.id, { onDelete: "set null" }), name: text("name").notNull(), description: text("description"), ...audit() });
export const requirements = sqliteTable("requirements", { id: integer("id").primaryKey({ autoIncrement: true }), initiativeId: integer("initiative_id").references(() => initiatives.id, { onDelete: "set null" }), title: text("title").notNull(), description: text("description"), type: text("type"), ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }), relatedSystem: text("related_system"), status: text("status").default("Not Start"), ...audit() });

/* ===== Product & Feature ===== */
export const products = sqliteTable("products", { id: integer("id").primaryKey({ autoIncrement: true }), requirementId: integer("requirement_id").references(() => requirements.id, { onDelete: "set null" }), name: text("name").notNull(), description: text("description"), status: text("status").default("Not Start"), priorityId: integer("priority_id").references(() => priorities.id, { onDelete: "set null" }), expectedDate: integer("expected_date", { mode: "timestamp" }), ...audit() });
export const productOwners = sqliteTable("product_owners", { id: integer("id").primaryKey({ autoIncrement: true }), productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), ...audit() }, (t) => ({ uniq: uniqueIndex("product_owners_uniq").on(t.productId, t.userId) }));
export const projects = sqliteTable("projects", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), description: text("description"), status: text("status").default("Not Start"), priorityId: integer("priority_id").references(() => priorities.id, { onDelete: "set null" }), categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }), themeId: integer("theme_id").references(() => themes.id, { onDelete: "set null" }), productId: integer("product_id").references(() => products.id, { onDelete: "set null" }), ...audit() });
export const projectManagers = sqliteTable("project_managers", { id: integer("id").primaryKey({ autoIncrement: true }), projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), ...audit() }, (t) => ({ uniq: uniqueIndex("project_managers_uniq").on(t.projectId, t.userId) }));
export const features = sqliteTable("features", { id: integer("id").primaryKey({ autoIncrement: true }), productId: integer("product_id").references(() => products.id, { onDelete: "set null" }), projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }), name: text("name").notNull(), description: text("description"), status: text("status").default("Not Start"), ...audit() });
export const featureResourcePlans = sqliteTable("feature_resource_plans", { id: integer("id").primaryKey({ autoIncrement: true }), featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }), roleRequired: text("role_required"), headcount: integer("headcount"), estimatedMandays: real("estimated_mandays"), ...audit() });

/* ===== Execution ===== */
export const projectMilestones = sqliteTable("project_milestones", { id: integer("id").primaryKey({ autoIncrement: true }), projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), title: text("title").notNull(), deliverable: text("deliverable"), targetDate: integer("target_date", { mode: "timestamp" }), status: text("status").default("Not Start"), ...audit() });
export const sprints = sqliteTable("sprints", { id: integer("id").primaryKey({ autoIncrement: true }), projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), name: text("name").notNull(), goal: text("goal"), startDate: integer("start_date", { mode: "timestamp" }), endDate: integer("end_date", { mode: "timestamp" }), status: text("status").default("Planning"), ...audit() });
export const workflowStatuses = sqliteTable("workflow_statuses", { id: integer("id").primaryKey({ autoIncrement: true }), projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }), name: text("name").notNull(), color: text("color"), category: text("category").notNull().default("todo"), sortOrder: integer("sort_order").notNull().default(0), ...audit() }, (t) => ({ projectIdx: index("workflow_statuses_project_idx").on(t.projectId) }));

/* ===== Task ===== */
export const tasks = sqliteTable("tasks", { id: integer("id").primaryKey({ autoIncrement: true }), featureId: integer("feature_id").references(() => features.id, { onDelete: "cascade" }), projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }), sprintId: integer("sprint_id").references(() => sprints.id, { onDelete: "set null" }), assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }), title: text("title").notNull(), note: text("note"), workflowStatusId: integer("workflow_status_id").references(() => workflowStatuses.id, { onDelete: "set null" }), priorityId: integer("priority_id").references(() => priorities.id, { onDelete: "set null" }), sortOrder: integer("sort_order").notNull().default(0), startDate: integer("start_date", { mode: "timestamp" }), dueDate: integer("due_date", { mode: "timestamp" }), completedDatetime: integer("completed_datetime", { mode: "timestamp" }), estimatedHours: real("estimated_hours"), budgetCost: real("budget_cost"), ...audit() }, (t) => ({ featureIdx: index("tasks_feature_idx").on(t.featureId), projectIdx: index("tasks_project_idx").on(t.projectId), statusIdx: index("tasks_status_idx").on(t.workflowStatusId), assigneeIdx: index("tasks_assignee_idx").on(t.assigneeId) }));
export const taskDependencies = sqliteTable("task_dependencies", { id: integer("id").primaryKey({ autoIncrement: true }), predecessorTaskId: integer("predecessor_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }), successorTaskId: integer("successor_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }), dependencyType: text("dependency_type").notNull().default("FS"), ...audit() });
export const taskTags = sqliteTable("task_tags", { id: integer("id").primaryKey({ autoIncrement: true }), taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }), tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }) }, (t) => ({ uniq: uniqueIndex("task_tags_uniq").on(t.taskId, t.tagId) }));
export const customFields = sqliteTable("custom_fields", { id: integer("id").primaryKey({ autoIncrement: true }), referenceType: text("reference_type").notNull(), name: text("name").notNull(), fieldType: text("field_type").notNull().default("Text"), options: text("options"), ...audit() });
export const customFieldValues = sqliteTable("custom_field_values", { id: integer("id").primaryKey({ autoIncrement: true }), customFieldId: integer("custom_field_id").notNull().references(() => customFields.id, { onDelete: "cascade" }), referenceId: integer("reference_id").notNull(), valueString: text("value_string"), valueNumber: real("value_number"), valueDate: integer("value_date", { mode: "timestamp" }), ...audit() });

/* ===== Tracking & collab ===== */
export const taskWorklogs = sqliteTable("task_worklogs", { id: integer("id").primaryKey({ autoIncrement: true }), taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }), userId: text("user_id").references(() => users.id, { onDelete: "set null" }), workDate: integer("work_date", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`), hoursSpent: real("hours_spent").notNull(), note: text("note"), ...audit() }, (t) => ({ taskIdx: index("task_worklogs_task_idx").on(t.taskId) }));
export const comments = sqliteTable("comments", { id: integer("id").primaryKey({ autoIncrement: true }), referenceType: text("reference_type").notNull(), referenceId: integer("reference_id").notNull(), userId: text("user_id").references(() => users.id, { onDelete: "set null" }), parentCommentId: integer("parent_comment_id"), content: text("content").notNull(), ...audit() }, (t) => ({ refIdx: index("comments_ref_idx").on(t.referenceType, t.referenceId) }));
export const activityLogs = sqliteTable("activity_logs", { id: integer("id").primaryKey({ autoIncrement: true }), referenceType: text("reference_type").notNull(), referenceId: integer("reference_id").notNull(), userId: text("user_id").references(() => users.id, { onDelete: "set null" }), action: text("action").notNull(), fieldChanged: text("field_changed"), oldValue: text("old_value"), newValue: text("new_value"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (t) => ({ refIdx: index("activity_logs_ref_idx").on(t.referenceType, t.referenceId) }));

/* ===== Risk / Issue / Meeting ===== */
export const risks = sqliteTable("risks", { id: integer("id").primaryKey({ autoIncrement: true }), projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }), title: text("title").notNull(), description: text("description"), probability: text("probability").default("Medium"), impact: text("impact").default("Medium"), mitigationPlan: text("mitigation_plan"), ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }), status: text("status").default("Open"), ...audit() });
export const issues = sqliteTable("issues", { id: integer("id").primaryKey({ autoIncrement: true }), referenceType: text("reference_type").notNull(), referenceId: integer("reference_id").notNull(), title: text("title").notNull(), description: text("description"), actionPlan: text("action_plan"), status: text("status").default("Open"), raisedBy: text("raised_by").references(() => users.id, { onDelete: "set null" }), actionedBy: text("actioned_by").references(() => users.id, { onDelete: "set null" }), ...audit() });
export const meetings = sqliteTable("meetings", { id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), meetingDate: integer("meeting_date", { mode: "timestamp" }), startTime: text("start_time"), organizer: text("organizer"), attendees: text("attendees"), projectName: text("project_name"), minutesLongtext: text("minutes_longtext"), internalNotes: text("internal_notes"), ...audit() });
export const meetingAttendees = sqliteTable("meeting_attendees", { id: integer("id").primaryKey({ autoIncrement: true }), meetingId: integer("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }), userId: text("user_id").references(() => users.id, { onDelete: "cascade" }) }, (t) => ({ uniq: uniqueIndex("meeting_attendees_uniq").on(t.meetingId, t.userId) }));
export const meetingReferences = sqliteTable("meeting_references", { id: integer("id").primaryKey({ autoIncrement: true }), meetingId: integer("meeting_id").notNull().references(() => meetings.id, { onDelete: "cascade" }), referenceType: text("reference_type").notNull(), referenceId: integer("reference_id").notNull() });
export const attachments = sqliteTable("attachments", { id: integer("id").primaryKey({ autoIncrement: true }), referenceType: text("reference_type").notNull(), referenceId: integer("reference_id").notNull(), fileType: text("file_type"), fileName: text("file_name"), gdriveFileId: text("gdrive_file_id"), gdriveWebLink: text("gdrive_web_link"), uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (t) => ({ refIdx: index("attachments_ref_idx").on(t.referenceType, t.referenceId) }));

/* ===== System & personal ===== */
export const systemSecrets = sqliteTable("system_secrets", { id: integer("id").primaryKey({ autoIncrement: true }), systemName: text("system_name").notNull(), keyName: text("key_name").notNull(), secretValue: text("secret_value"), note: text("note"), ...audit() });
export const userTodos = sqliteTable("user_todos", { id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }), title: text("title").notNull(), targetDate: integer("target_date", { mode: "timestamp" }), status: text("status").default("todo"), ...audit() }, (t) => ({ userIdx: index("user_todos_user_idx").on(t.userId) }));
export const notifications = sqliteTable("notifications", { id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }), actionType: text("action_type"), referenceType: text("reference_type"), referenceId: integer("reference_id"), message: text("message"), isRead: integer("is_read").notNull().default(0), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) }, (t) => ({ userIdx: index("notifications_user_idx").on(t.userId) }));

/* ===== Relations ===== */
export const projectsRelations = relations(projects, ({ many }) => ({ features: many(features), workflowStatuses: many(workflowStatuses), tasks: many(tasks) }));
export const tasksRelations = relations(tasks, ({ one, many }) => ({ feature: one(features, { fields: [tasks.featureId], references: [features.id] }), project: one(projects, { fields: [tasks.projectId], references: [projects.id] }), workflowStatus: one(workflowStatuses, { fields: [tasks.workflowStatusId], references: [workflowStatuses.id] }), assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }), worklogs: many(taskWorklogs) }));

/* ===== v27: Working Team roster + per-user visibility ===== */
export const teamRoster = sqliteTable("team_roster", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), responsibility: text("responsibility"), pmRole: text("pm_role"), projectId: integer("project_id"), productId: integer("product_id"), ownerUserId: text("owner_user_id"), createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`) });
export const teamHidden = sqliteTable("team_hidden", { id: integer("id").primaryKey({ autoIncrement: true }), viewerId: text("viewer_id").notNull(), targetKind: text("target_kind").notNull(), targetId: text("target_id").notNull() }, (t) => ({ uniq: uniqueIndex("team_hidden_uniq").on(t.viewerId, t.targetKind, t.targetId) }));
