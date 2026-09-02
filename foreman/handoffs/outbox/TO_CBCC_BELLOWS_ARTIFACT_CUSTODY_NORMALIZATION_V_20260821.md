# Vision — Bellows Artifact Custody Normalization

Date: 2026-08-21  
Lane: Public Bellows / device drafts  
Executor: Dink@Betsy  
Review requested from: Ender, Bean, and Doozer

## Problem

Five Bellows artifacts now use explicit device save/restore/clear. Assumption Test remains copy-only, while Evidence Brief restores loosely shaped browser data without exact keys or text-length limits. That inconsistency can lose member work or display malformed local state.

## Candidate

1. Give Assumption Test the same explicit device save, exact restore validation, copy, and clear behavior.
2. Harden Evidence Brief restore to exact top-level and field keys, bounded text, and known enum values; reject the whole malformed draft instead of partially laundering it into the UI.

## Hard edges

- Device only; no account custody, network write, automatic share, or cross-tool storage.
- Existing valid drafts must continue restoring.
- Invalid shape fails closed and does not partially populate fields.
- No production, schema, provider, secret, payment, push, or deploy action.
