import { redirect } from "next/navigation";

export const metadata = {
  title: "GimpDash | Werkles",
  robots: { index: false, follow: false }
};

/** Single console lives on Foreman Control Panel — not a separate Next route. */
export default function GdCommandConsoleRedirectPage() {
  redirect("http://127.0.0.1:4317/#gimpdash");
}
