import Link from "next/link";

import { copy } from "@/lib/copy";

type PublicTrustFooterProps = {
  showProofDisclaimer?: boolean;
};

export function PublicTrustFooter({ showProofDisclaimer = false }: PublicTrustFooterProps) {
  return (
    <footer className="site-footer">
      {showProofDisclaimer ? <p>{copy.proofDisclaimer}</p> : null}
      <p>{copy.disclaimer}</p>
      <nav className="site-footer__trust-links" aria-label="Public trust">
        <Link href="/privacy">Public Test Data Notice</Link>
      </nav>
    </footer>
  );
}
