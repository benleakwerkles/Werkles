import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { hasHarveyPrivatePageSession } from "@/lib/harvey/private-access";
import HarveyPrivateLoginForm from "./HarveyPrivateLoginForm";

export const metadata: Metadata = {
  title: "Private Harvey | Werkles",
  description: "Private access gate for Harvey.",
  robots: { index: false, follow: false, nocache: true }
};

export const dynamic = "force-dynamic";

export default async function HarveyAccessPage() {
  if (await hasHarveyPrivatePageSession()) redirect("/harvey");
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#080a0c", color: "#edf0e8", padding: 20, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <section style={{ width: "min(100%, 480px)", border: "1px solid #414944", borderRadius: 18, background: "#101416", padding: "clamp(22px, 5vw, 38px)", boxShadow: "0 24px 80px rgba(0,0,0,.45)" }}>
        <p style={{ margin: 0, color: "#e1ad43", letterSpacing: 2, fontWeight: 900 }}>WERKLES / PRIVATE</p>
        <h1 style={{ margin: "10px 0", fontSize: "clamp(34px, 9vw, 58px)", lineHeight: 1, color: "#fff4d6" }}>Harvey</h1>
        <p style={{ margin: "0 0 26px", color: "#b8c0ba", lineHeight: 1.55 }}>This cockpit is private. The password is checked on the server and is never shipped with the page.</p>
        <HarveyPrivateLoginForm />
      </section>
    </main>
  );
}
