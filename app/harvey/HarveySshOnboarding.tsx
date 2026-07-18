const steps = [
  ["1", "Discover", "Prove the machine, signed-in OS profile, repo path, branch, commit, and working tree."],
  ["2", "Prepare locally", "Inspect public SSH metadata, propose a new machine-and-profile-specific key path, and preserve every unrelated SSH setting."],
  ["3", "Approve at GitHub", "Open the correct GitHub page with benleakwerkles visible. The operator alone signs in and clicks Add SSH key."],
  ["4", "Verify separately", "Confirm the GitHub identity first, then confirm read access to benleakwerkles/Werkles. Neither check authorizes a push."],
  ["5", "Connect the checkout", "Offer a clone or an origin change only after conflicts and owner mismatches are resolved."],
  ["6", "Return proof", "Write a non-secret local receipt outside the repo and cloud-synced folders."],
] as const;

const states = [
  "NOT_STARTED",
  "DISCOVERING",
  "AWAITING_IDENTITY_CONFIRMATION",
  "READY_TO_GENERATE",
  "AWAITING_PASSPHRASE_DECISION",
  "KEY_GENERATED",
  "AWAITING_HOST_TRUST",
  "AWAITING_GITHUB_APPROVAL",
  "VERIFYING",
  "IDENTITY_VERIFIED",
  "REPO_READ_VERIFIED",
  "AWAITING_REMOTE_APPROVAL",
  "CONNECTED",
  "CONFLICT",
  "VERIFICATION_FAILED",
  "REVOKED",
] as const;

export default function HarveySshOnboarding() {
  return (
    <section data-testid="harvey-ssh-onboarding" style={{ maxWidth: 1200, margin: "0 auto 18px", border: "1px solid #66706b", borderRadius: 16, padding: "clamp(16px,3vw,26px)", background: "linear-gradient(145deg,#131a18,#101416)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "start", gap: 14 }}>
        <div>
          <p style={{ color: "#8ef0ae", fontWeight: 900, letterSpacing: 1.2, margin: 0 }}>AEYE INVENTION RECEIVED</p>
          <h2 style={{ color: "#fff4d6", fontSize: "clamp(24px,4vw,38px)", margin: "7px 0" }}>Connect this machine to GitHub with SSH</h2>
          <p style={{ maxWidth: 820, color: "#c6cec9", lineHeight: 1.55, margin: 0 }}>A guided, account-safe route to Werkles without recurring browser, SMS, or OAuth device-code prompts.</p>
        </div>
        <div data-testid="harvey-ssh-onboarding-state" style={{ padding: "9px 12px", borderRadius: 999, border: "1px solid #d8a84e", background: "#392d18", color: "#ffda8a", fontWeight: 900 }}>
          REVIEW READY · NOT ACTIVATED
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(230px,100%),1fr))", gap: 10, marginTop: 18 }}>
        <div style={{ padding: 13, borderRadius: 10, background: "#0d1112", border: "1px solid #46504b" }}><strong style={{ color: "#fff4d6" }}>GitHub account</strong><div style={{ color: "#c6cec9", marginTop: 4 }}>benleakwerkles</div></div>
        <div style={{ padding: 13, borderRadius: 10, background: "#0d1112", border: "1px solid #46504b" }}><strong style={{ color: "#fff4d6" }}>Repository</strong><div style={{ color: "#c6cec9", marginTop: 4 }}>benleakwerkles/Werkles</div></div>
        <div style={{ padding: 13, borderRadius: 10, background: "#0d1112", border: "1px solid #46504b" }}><strong style={{ color: "#fff4d6" }}>Canonical repo ID</strong><div style={{ color: "#c6cec9", marginTop: 4 }}>1242158598</div></div>
        <div style={{ padding: 13, borderRadius: 10, background: "#0d1112", border: "1px solid #46504b" }}><strong style={{ color: "#fff4d6" }}>SSH host alias</strong><div style={{ color: "#c6cec9", marginTop: 4, overflowWrap: "anywhere" }}>github-benleakwerkles</div></div>
      </div>

      <div style={{ marginTop: 14, padding: 14, borderRadius: 11, border: "1px solid #7f754f", background: "#19170f", color: "#ffe0a3", lineHeight: 1.5 }}>
        <strong>Identity boundary:</strong> every connection binds the project namespace + canonical repo ID + GitHub account + canonical machine + hostname evidence + OS user SID/UID + workspace + public-key fingerprint. Harvey must not change Courtney&apos;s defaults while connecting Ben&apos;s Werkles route on Medullina.
      </div>

      <div data-testid="harvey-ssh-current-step" style={{ marginTop: 14, padding: 15, borderRadius: 11, border: "1px solid #497b59", background: "#102018" }}>
        <strong style={{ color: "#8ef0ae" }}>CURRENT STEP · NOT_STARTED</strong>
        <p style={{ color: "#d6dbd7", margin: "7px 0 0", lineHeight: 1.5 }}>Review and test the workflow contract. No SSH key has been generated, no SSH config has changed, and no GitHub setting has changed.</p>
      </div>

      <details style={{ marginTop: 14, border: "1px solid #46504b", borderRadius: 11, padding: 13, background: "#0d1112" }}>
        <summary style={{ cursor: "pointer", color: "#fff4d6", fontWeight: 900 }}>See the six-step onboarding plan</summary>
        <ol style={{ display: "grid", gap: 9, padding: 0, margin: "13px 0 0", listStyle: "none" }}>
          {steps.map(([number, title, copy]) => (
            <li key={number} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start", color: "#c6cec9" }}>
              <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 999, background: "#25432f", color: "#9ef2b7", fontWeight: 900 }}>{number}</span>
              <span><strong style={{ color: "#edf0e8" }}>{title}</strong><br />{copy}</span>
            </li>
          ))}
        </ol>
      </details>

      <details style={{ marginTop: 10, border: "1px solid #46504b", borderRadius: 11, padding: 13, background: "#0d1112" }}>
        <summary style={{ cursor: "pointer", color: "#fff4d6", fontWeight: 900 }}>Technical state machine</summary>
        <p style={{ color: "#aeb6b0", lineHeight: 1.6, marginBottom: 0 }}>{states.join(" → ")}</p>
      </details>

      <p style={{ color: "#ffcc73", margin: "14px 0 0", lineHeight: 1.5 }}><strong>Human gate:</strong> GitHub sign-in and the final Add SSH key approval remain operator-only. CONNECTED proves the named identity and repository route; it never authorizes push, merge, deploy, or release.</p>
    </section>
  );
}
