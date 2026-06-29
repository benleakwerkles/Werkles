import type { Metadata } from "next";

import { TinkerDenIntakeForm } from "./tinkerden-intake-form";

export const metadata: Metadata = {
  title: "TinkerDen Intake | Werkles",
  description: "Create a TinkerDen packet card without markdown packet construction.",
  robots: { index: false, follow: false }
};

const intakeScript = `
(() => {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function field(label, value) {
    return "<p><strong>" + label + "</strong> " + escapeHtml(value) + "</p>";
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-tinkerden-intake-form]");
    if (!form) return;

    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const output = document.querySelector("[data-generated-card]");
    const values = Object.fromEntries(new FormData(form).entries());

    if (button) button.textContent = "CREATING...";

    try {
      const response = await fetch("/api/tinkerden/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json();

      if (!response.ok || !result.ok || !result.packet) {
        const missing = result.missing?.length ? "Missing: " + result.missing.join(", ") : (result.error || "Could not create card.");
        output.innerHTML = "<p class='td-intake__error'>" + escapeHtml(missing) + "</p>";
        return;
      }

      const packet = result.packet;
      output.innerHTML =
        "<article class='td-spine-card'>" +
        field("packet_id", packet.packet_id) +
        field("created_at", packet.created_at) +
        field("status", packet.status) +
        field("title", packet.title) +
        field("target", packet.target_aeye) +
        field("machine", packet.target_machine) +
        field("mission", packet.mission) +
        field("purpose", packet.purpose) +
        field("return", packet.return_destination) +
        "<a href='/tinkerden'>Open OUTBOX</a>" +
        "</article>";
      form.reset();
    } catch (error) {
      output.innerHTML = "<p class='td-intake__error'>" + escapeHtml(error?.message || "Could not create card.") + "</p>";
    } finally {
      if (button) button.textContent = "CREATE CARD";
    }
  });
})();
`;

export default function TinkerDenIntakePage() {
  return (
    <>
      <TinkerDenIntakeForm />
      <script dangerouslySetInnerHTML={{ __html: intakeScript }} />
    </>
  );
}
