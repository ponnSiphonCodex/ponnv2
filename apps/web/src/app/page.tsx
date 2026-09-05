/**
 * apps/web/src/app/page.tsx  (หน้า Portal / redirect logic)
 *
 * ⚠️ ต้องมี 2 อย่างนี้เพื่อไม่ให้ build fail ตอน prerender:
 *   1) export const dynamic = "force-dynamic"  → บอก Next.js ว่าห้าม prerender เป็น static
 *      (เพราะหน้านี้ต้องอ่าน D1 + session ตอน request จริง)
 *   2) await getCloudflareContext({ async: true }) → เรียกแบบ async
 *      (แบบ sync ใช้ได้เฉพาะใน dynamic route ที่ไม่ถูก prerender เท่านั้น)
 */
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, systemRoles, userRoles } from "@/db";
import { getAuthConfig } from "@/lib/auth";
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

  const modules = Array.from(new Set(roleRows.map((r) => r.module)));

  if (modules.length === 0 || (modules.length === 1 && modules[0] === "PM")) {
    redirect("/pm");
  }

  return (
    <main style={{ padding: 48, fontFamily: "sans-serif", background: "#F4F4F6", minHeight: "100vh" }}>
      <h1 style={{ color: "#001D58", marginBottom: 8 }}>ระบบของคุณ</h1>
      <p style={{ color: "#6B7280", marginBottom: 32 }}>เลือกระบบที่ต้องการเข้าใช้งาน</p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {modules.includes("PM") && (
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
            <h3 style={{ margin: 0, color: "#001D58" }}>PM & Portfolio</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>Project Management &amp; Portfolio</p>
          </a>
        )}

        {modules.includes("RENTALS") && (
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
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6B7280" }}>ระบบบริหารหอพัก (ระบบภายนอก)</p>
          </a>
        )}
      </div>
    </main>
  );
}
