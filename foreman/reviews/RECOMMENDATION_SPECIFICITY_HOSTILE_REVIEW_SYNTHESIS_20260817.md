# Foreman synthesis — Recommendation specificity hostile review

Date: 2026-08-17
Foreman: Heimerdinker@Betsy
Input: `FROM_ORSON_DOOZER_RECOMMENDATION_SPECIFICITY_HOSTILE_REVIEW_20260817`
Decision: `BOUNDED_REPAIR_REQUIRED`

Orson/Doozer confirmed the presentation direction but found three defects inside
the already-reviewed contract: unsafe raw copy selection, a headline pretending
to establish fit, and a missing-next-step path that can remove the summary.

The authorized repair remains presentation-only:

- derive all three fields through one pure member-facing selector;
- reject empty/internal/diagnostic candidates;
- use honest fixed fallbacks for fit, caution, and next action;
- add executable hostile cases for blanks and internal-language injection;
- change no matching score, source data, persistence, provider, route, profile,
  account, or governance behavior.

The repaired result remains a builder candidate until Orson/Doozer reviews the
new exact hash.
