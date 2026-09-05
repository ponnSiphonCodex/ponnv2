/**
 * apps/web/src/app/page.tsx (Portal / redirect logic)
 *
 * กติกา: ถ้าผู้ใช้มีสิทธิ์เข้าระบบอื่นนอกเหนือจาก PM (ปัจจุบันมีแค่ RENTALS)
 * ให้แสดงหน้าเลือกระบบ ไม่งั้น redirect ตรงเข้า /pm เลย (ไม่ต้องเสียเวลาคลิกเพิ่ม)
 */
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, systemRoles, userRoles } from "@/db";
import { getAuthConfig } from "@/lib/auth";
import { RocketLogo } from "@/components/RocketLogo";
import NextAuth from "next-auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { env } = await getCloudflareContext({ async: true });

  const db = createDb(env.DB);
  const { auth } = NextAuth(
    getAuthConfig(db, {
      AUTH_SECRET: env.AUTH_SECRET,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    })
  );

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const roleRows = await db
    .select({ module: systemRoles.module })
    .from(userRoles)
    .innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id))
    .where(eq(userRoles.userId, session.user.id));

  const modules = new Set(roleRows.map((r) => r.module));
  const hasRentals = modules.has("RENTALS");

  if (!hasRentals) {
    redirect("/pm");
  }

  return (
    <main style={{ padding: 48, fontFamily: "'Sarabun', sans-serif", background: "#F4F4F6", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <RocketLogo size={28} />
        <h1 style={{ color: "#001D58", margin: 0 }}>Portfolio Workspace</h1>
      </div>
      <p style={{ color: "#6B7280", marginBottom: 32 }}>เลือกระบบที่ต้องการเข้าใช้งาน</p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <a
          href="/pm"
          style={{
            display: "block",
            width: 260,
            padding: 24,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            textDecoration: "none",
            color: "#111827",
            borderTop: "4px solid #001D58",
          }}
        >
          <h3 style={{ margin: 0, color: "#001D58" }}>PM &amp; Portfolio</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>บริหารโครงการและพอร์ตองค์กร</p>
        </a>

        <a
          href="https://rentals.ponnsth.com"
          style={{
            display: "block",
            width: 260,
            padding: 24,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            textDecoration: "none",
            color: "#111827",
            borderTop: "4px solid #EC186E",
          }}
        >
          <h3 style={{ margin: 0, color: "#EC186E" }}>Rentals Management</h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>ระบบบริหารหอพัก</p>
        </a>
      </div>
    </main>
  );
}
