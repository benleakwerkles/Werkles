# Vision — Supplier Comparison Custody Hardening

Date: 2026-08-21  
Lane: Public Bellows / supplier comparison  
Executor: Dink@Betsy  
Review requested from: Bean and Doozer

## Problem

Supplier Comparison saves on the device, but its restore helper accepts extra row/envelope keys and unbounded strings. That makes it the remaining weak validator among the six Bellows artifacts.

## Candidate

Require exact `requirement` + `rows` envelope keys, exactly three rows, exactly six row keys, bounded names/numeric inputs, and a bounded requirement. Add matching UI `maxLength` limits and browser attacks for extra keys and oversized values.

## Hard edges

- Preserve valid existing v1 drafts.
- Reject malformed drafts whole; do not partially populate or calculate them.
- No price claim, provider ranking, account custody, network write, schema, provider, secret, payment, push, or deploy.
