import { redirect } from "next/navigation";

export const metadata = {
  title: "Speaker | GD",
  robots: { index: false, follow: false }
};

/** Speaker window lives on Foreman — constitutionally separate from GimpDash owner. */
export default function GdSpeakerRedirectPage() {
  redirect("http://127.0.0.1:4317/#gd-speaker");
}
