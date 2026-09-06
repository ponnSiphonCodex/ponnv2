/** entities.ts — registry ของทุก entity ที่ generic CRUD ใช้ (pure, ใช้ได้ทั้ง client/server) */
export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "ref";
export type Field = { key: string; label: string; type: FieldType; required?: boolean; listShow?: boolean; options?: string[]; refEntity?: string };
export type EntityDef = { table: string; label: string; fields: Field[]; masterOnly?: boolean; defaultOrder?: string; scoped?: boolean };

const STATUS = ["Backlog", "Not Start", "In Progress", "Done", "Drop", "Pending"];

export const ENTITIES: Record<string, EntityDef> = {
  themes: { table: "themes", label: "Themes (กลยุทธ์)", masterOnly: true, defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ Theme", type: "text", required: true, listShow: true },
    { key: "description", label: "คำอธิบาย", type: "textarea", listShow: true } ] },
  initiatives: { table: "initiatives", label: "Initiatives", masterOnly: true, defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ Initiative", type: "text", required: true, listShow: true },
    { key: "theme_id", label: "Theme", type: "ref", refEntity: "themes", listShow: true },
    { key: "description", label: "คำอธิบาย", type: "textarea" } ] },
  requirements: { table: "requirements", label: "Requirements", defaultOrder: "id ASC", fields: [
    { key: "title", label: "หัวข้อ", type: "text", required: true, listShow: true },
    { key: "type", label: "ประเภท", type: "select", options: ["CR", "Initiatives", "BAU"], listShow: true },
    { key: "initiative_id", label: "Initiative", type: "ref", refEntity: "initiatives" },
    { key: "owner_id", label: "Owner", type: "ref", refEntity: "users", listShow: true },
    { key: "related_system", label: "ระบบที่เกี่ยวข้อง", type: "text" },
    { key: "status", label: "สถานะ", type: "select", options: STATUS, listShow: true },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  products: { table: "products", label: "Products", defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ Product", type: "text", required: true, listShow: true },
    { key: "owner_id", label: "Product Owner", type: "ref", refEntity: "users", listShow: true },
    { key: "requirement_id", label: "Requirement", type: "ref", refEntity: "requirements" },
    { key: "status", label: "สถานะ", type: "select", options: STATUS, listShow: true },
    { key: "priority_id", label: "Priority", type: "ref", refEntity: "priorities", listShow: true },
    { key: "expected_date", label: "กำหนดคาดหวัง", type: "date", listShow: true },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  projects: { table: "projects", label: "Projects", defaultOrder: "id ASC", scoped: true, fields: [
    { key: "name", label: "ชื่อโครงการ", type: "text", required: true, listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: STATUS, listShow: true },
    { key: "start_date", label: "วันเริ่มโครงการ", type: "date", listShow: true },
    { key: "end_date", label: "วันสิ้นสุดโครงการ", type: "date", listShow: true },
    { key: "priority_id", label: "Priority", type: "ref", refEntity: "priorities", listShow: true },
    { key: "category_id", label: "Category", type: "ref", refEntity: "categories", listShow: true },
    { key: "product_id", label: "Product", type: "ref", refEntity: "products", listShow: true },
    { key: "theme_id", label: "Theme", type: "ref", refEntity: "themes" },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  features: { table: "features", label: "Features", defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ Feature", type: "text", required: true, listShow: true },
    { key: "product_id", label: "Product", type: "ref", refEntity: "products", listShow: true },
    { key: "project_id", label: "Project", type: "ref", refEntity: "projects", listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: STATUS, listShow: true },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  milestones: { table: "project_milestones", label: "Milestones", defaultOrder: "project_id ASC, target_date ASC", fields: [
    { key: "project_id", label: "Project", type: "ref", refEntity: "projects", required: true, listShow: true },
    { key: "title", label: "หัวข้อ", type: "text", required: true, listShow: true },
    { key: "deliverable", label: "สิ่งที่ต้องส่งมอบ", type: "text", listShow: true },
    { key: "target_date", label: "วันที่เป้าหมาย", type: "date", listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: STATUS, listShow: true } ] },
  sprints: { table: "sprints", label: "Sprints", defaultOrder: "id DESC", fields: [
    { key: "name", label: "ชื่อ Sprint", type: "text", required: true, listShow: true },
    { key: "project_id", label: "Project", type: "ref", refEntity: "projects", listShow: true },
    { key: "goal", label: "เป้าหมาย", type: "text", listShow: true },
    { key: "start_date", label: "เริ่ม", type: "date", listShow: true },
    { key: "end_date", label: "สิ้นสุด", type: "date", listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: ["Planning", "Active", "Closed"], listShow: true } ] },
  issues: { table: "issues", label: "Issues", defaultOrder: "id DESC", fields: [
    { key: "title", label: "หัวข้อปัญหา", type: "text", required: true, listShow: true },
    { key: "reference_type", label: "อยู่ที่ Layer", type: "select", options: ["project", "feature", "product", "task"], required: true, listShow: true },
    { key: "reference_id", label: "อ้างอิง ID", type: "number", required: true, listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: ["Open", "In Progress", "Closed"], listShow: true },
    { key: "raised_by", label: "ผู้แจ้ง", type: "ref", refEntity: "users", listShow: true },
    { key: "actioned_by", label: "ผู้รับผิดชอบ", type: "ref", refEntity: "users" },
    { key: "action_plan", label: "แผนแก้ไข", type: "textarea" },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  risks: { table: "risks", label: "Risks", defaultOrder: "id DESC", fields: [
    { key: "title", label: "ความเสี่ยง", type: "text", required: true, listShow: true },
    { key: "project_id", label: "Project", type: "ref", refEntity: "projects", listShow: true },
    { key: "probability", label: "โอกาสเกิด", type: "select", options: ["High", "Medium", "Low"], listShow: true },
    { key: "impact", label: "ผลกระทบ", type: "select", options: ["High", "Medium", "Low"], listShow: true },
    { key: "owner_id", label: "ผู้รับผิดชอบ", type: "ref", refEntity: "users", listShow: true },
    { key: "status", label: "สถานะ", type: "select", options: ["Open", "Mitigating", "Closed"], listShow: true },
    { key: "mitigation_plan", label: "แผนรับมือ", type: "textarea" },
    { key: "description", label: "รายละเอียด", type: "textarea" } ] },
  meetings: { table: "meetings", label: "Meetings", defaultOrder: "meeting_date DESC", fields: [
    { key: "title", label: "หัวข้อประชุม", type: "text", required: true, listShow: true },
    { key: "meeting_date", label: "วันที่", type: "date", listShow: true },
    { key: "minutes_longtext", label: "สรุปการประชุม", type: "textarea" },
    { key: "internal_notes", label: "โน้ตระหว่างประชุม", type: "textarea" } ] },
  priorities: { table: "priorities", label: "Priorities", masterOnly: true, defaultOrder: "level ASC", fields: [
    { key: "name", label: "ชื่อ", type: "text", required: true, listShow: true },
    { key: "level", label: "ระดับ (1=สูงสุด)", type: "number", listShow: true },
    { key: "color", label: "สี (hex)", type: "text", listShow: true } ] },
  categories: { table: "categories", label: "Categories", masterOnly: true, defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ", type: "text", required: true, listShow: true },
    { key: "color", label: "สี (hex)", type: "text", listShow: true } ] },
  tags: { table: "tags", label: "Tags", masterOnly: true, defaultOrder: "id ASC", fields: [
    { key: "name", label: "ชื่อ", type: "text", required: true, listShow: true },
    { key: "color", label: "สี (hex)", type: "text", listShow: true } ] },
};
export function entityDef(name: string): EntityDef | null { return ENTITIES[name] ?? null; }
export function dbColumns(def: EntityDef): string[] { return def.fields.map((f) => f.key); }
export function dateColumns(def: EntityDef): string[] { return def.fields.filter((f) => f.type === "date").map((f) => f.key); }
