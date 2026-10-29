"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SkyPookaDocViewer() {
  const searchParams = useSearchParams();
  const docPath = searchParams.get("path");
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadDoc = useCallback(async () => {
    if (!docPath) {
      setError("No document path provided.");
      return;
    }

    try {
      const response = await fetch(`/api/skypooka/doc?path=${encodeURIComponent(docPath)}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as { ok?: boolean; content?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.content) {
        throw new Error(payload.error ?? "Document read failed");
      }
      setContent(payload.content);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Document read failed");
    }
  }, [docPath]);

  useEffect(() => {
    void loadDoc();
  }, [loadDoc]);

  if (!docPath) {
    return <div className="skypooka-empty">Choose a handoff document from Field view.</div>;
  }

  if (error) {
    return <div className="skypooka-error">{error}</div>;
  }

  if (!content) {
    return <div className="skypooka-loading">Loading document…</div>;
  }

  return (
    <>
      <div className="skypooka-meta skypooka-meta--muted">{docPath}</div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "13px",
          lineHeight: 1.55,
          color: "#efe7da",
          background: "#1e1813",
          border: "1px solid #3a2f22",
          borderRadius: "12px",
          padding: "14px",
          marginTop: "12px"
        }}
      >
        {content}
      </pre>
      <div className="skypooka-actions">
        <Link className="skypooka-btn skypooka-btn--open" href="/skypooka">
          BACK TO FIELD
        </Link>
      </div>
    </>
  );
}
