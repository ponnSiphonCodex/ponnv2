/**
 * access.ts — PM-role based access (contextual RBAC)
 * PMO = เห็น/แก้ทั้งหมด
 * Product Owner = เห็น/แก้เฉพาะ Product ที่เป็นเจ้าของ (+ project/feature ใต้ product นั้น)
 * Project Manager / Co-Ordinator / Working Team = เฉพาะ project ที่ถูก assign
 * System Admin (system role) = เหนือทุกอย่าง
 */
export type Scope = {
  isAdmin: boolean;
  isGuest: boolean;
  pmRole: string | null;
  isPmo: boolean;
  ownedProductIds: number[];
  managedProjectIds: number[];
};

export async function loadScope(d1: D1Database, userId: string, isAdmin: boolean, isGuest: boolean): Promise<Scope> {
  const u = await d1.prepare(`SELECT pm_role FROM users WHERE id = ?`).bind(userId).first<{ pm_role: string | null }>();
  const pmRole = u?.pm_role ?? null;
  const isPmo = isAdmin || pmRole === "PMO";
  const po = await d1.prepare(`SELECT product_id FROM product_owners WHERE user_id = ?`).bind(userId).all();
  const ownedProductIds = (po.results ?? []).map((r: any) => r.product_id as number);
  const pm = await d1.prepare(`SELECT project_id FROM project_managers WHERE user_id = ?`).bind(userId).all();
  const managedProjectIds = (pm.results ?? []).map((r: any) => r.project_id as number);
  return { isAdmin, isGuest, pmRole, isPmo, ownedProductIds, managedProjectIds };
}

// project ที่ user มองเห็นได้ (null = เห็นทั้งหมด)
export async function visibleProjectIds(d1: D1Database, scope: Scope): Promise<number[] | null> {
  if (scope.isPmo) return null;
  const set = new Set<number>(scope.managedProjectIds);
  if (scope.ownedProductIds.length) {
    const ph = scope.ownedProductIds.map(() => "?").join(",");
    const r = await d1.prepare(`SELECT id FROM projects WHERE product_id IN (${ph})`).bind(...scope.ownedProductIds).all();
    for (const row of (r.results ?? [])) set.add((row as any).id);
  }
  return Array.from(set);
}

export function canEditProject(scope: Scope, projectId: number, productId: number | null): boolean {
  if (scope.isPmo) return true;
  if (scope.managedProjectIds.includes(projectId)) return true;
  if (productId != null && scope.ownedProductIds.includes(productId)) return true;
  return false;
}
