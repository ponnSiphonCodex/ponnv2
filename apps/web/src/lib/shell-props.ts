import type { PageAuth } from "./page-auth";
export function shellProps(a: PageAuth) {
  return { user: { id: a.user.sub, name: a.user.name, email: a.user.email, image: a.user.image, avatarUrl: a.user.avatarUrl }, isAdmin: a.admin, canMaster: a.scope.isPmo, guest: a.guest, systemRole: a.systemRole, roleLabel: a.roleLabel, impersonating: a.impersonating, realName: a.realUser?.name ?? a.realUser?.email ?? null };
}
