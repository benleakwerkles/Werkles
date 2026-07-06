"use client";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (public_token: string) => void;
        onExit: () => void;
      }) => { open: () => void };
    };
  }
}

const PLAID_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadPlaidScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Plaid) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${PLAID_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Plaid script failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = PLAID_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Plaid script failed to load."));
    document.body.appendChild(script);
  });
}

export async function launchPlaidLink(
  linkToken: string,
  onSuccess: (publicToken: string) => void,
  onExit?: () => void
) {
  await loadPlaidScript();
  if (!window.Plaid) {
    throw new Error("Plaid Link is unavailable.");
  }

  const handler = window.Plaid.create({
    token: linkToken,
    onSuccess: (publicToken) => onSuccess(publicToken),
    onExit: () => onExit?.()
  });

  handler.open();
}
