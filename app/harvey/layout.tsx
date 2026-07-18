import { requireHarveyPrivatePageSession } from "@/lib/harvey/private-access";

export const dynamic = "force-dynamic";

export default async function HarveyPrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireHarveyPrivatePageSession();
  return (
    <>
      <form action="/api/harvey-private-access/logout" method="post" style={{ position: "sticky", top: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, borderBottom: "1px solid #2f3934", background: "rgba(8, 11, 12, .96)", color: "#aeb6b0", padding: "7px 12px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: 12 }}>
        <span>Private Harvey session</span>
        <button type="submit" style={{ border: "1px solid #68716b", borderRadius: 8, background: "#111715", color: "#edf0e8", padding: "7px 11px", cursor: "pointer", fontWeight: 800 }}>
          Lock Harvey
        </button>
      </form>
      {children}
    </>
  );
}
