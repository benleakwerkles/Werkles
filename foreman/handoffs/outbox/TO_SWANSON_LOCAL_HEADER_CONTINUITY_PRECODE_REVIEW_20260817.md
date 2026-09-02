# To Swanson / Petra — local header continuity pre-code review

Date: 2026-08-17  
From: Heimerdinker@Betsy  
Review type: personal, pre-code, source-bounded  
No subagents, edits, new tasks/environments, providers, secrets, SQL, push, or deploy.

## Rendered defect

The local walkthrough entry at `/login?next=/dashboard/blueprints` truthfully says no account is created. Clicking `Continue local walkthrough` establishes the local preview and returns to the populated Workshop with the same six-of-nine Intake. Workshop then links to the populated Recommendations page, which ranks one option from those answers.

However, the public header on Recommendations still renders `Sign in`. Ben previously reported that completing Intake appeared to sign him out. The saved local Intake is present; the header is teaching the opposite state.

## Exact current header

Path: `components/foundry/site-header.tsx`

```tsx
export function SiteHeader() {
  return (
    <header className="site-header site-header--nav-doc">
      <Link className="brand brand--tight" href="/" aria-label="Werkles home">
        <BrandMark size="header" presentation="board" />
        <span className="brand-word brand-word--workshop-serif">erkles</span>
      </Link>
      <nav aria-label="Primary navigation">
        {primaryNavItems.map((item) => (
          <Link key={item.id} href={item.href} className="site-nav-link" title={item.symbol}>
            <span className="site-nav-link__label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__login" href="/login">
          {copy.nav.login}
        </Link>
        <Link className="header-cta" href="/bellows/intake">
          {copy.nav.cta}
        </Link>
      </div>
    </header>
  );
}
```

`SiteHeader` is a server component. The local preview session is represented by the HttpOnly `werkles_dev_preview` cookie set by the server login route. Real Supabase authentication must remain separate and must not be inferred from that cookie.

## Proposed smallest repair

1. Let the server header read only whether the local preview cookie is present and valid.
2. In that local-preview state, replace `Sign in` with a truthful `Local walkthrough` link to `/dashboard`.
3. Keep `Sign in` unchanged when the local preview cookie is absent.
4. Do not call the local preview a member account, saved profile, synced session, or real authentication.
5. Do not attempt a general real-Supabase header-auth redesign in this slice.

## Questions

1. Is that the smallest truthful correction, or would it create a worse state claim?
2. What exact label and destination should local preview use?
3. What must the focused test attack so it cannot launder local walkthrough state into real authentication?

## Required return

State `PERSONAL_REVIEW`, `NO_SUBAGENTS`, execution context, `PASS` or `BLOCKER`, corrected lesson, strict bounded repair, exact hostile checks, and residual debt. Review only this relayed source and observed behavior.
