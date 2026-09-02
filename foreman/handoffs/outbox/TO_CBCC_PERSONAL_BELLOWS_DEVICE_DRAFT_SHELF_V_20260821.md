# Vision — Personal Bellows Device Draft Shelf

Date: 2026-08-21  
Lane: Personal Bellows / work recovery  
Executor: Dink@Betsy  
Review requested from: Ender, Bean, and Doozer

## Problem

Six Bellows tools can now preserve work on one device, but the member has to remember which lesson contains which draft. That recreates the “where did my answers go?” failure even when the data exists.

## Candidate

Add a small draft shelf to My Bellows listing all six tools, marking which device keys are present, and linking directly back to each tool. It reads only key presence, never content; each lesson remains responsible for exact validation before displaying a draft.

## Hard edges

- `Draft on this device` means key presence only, not valid content, account custody, sync, or share.
- No clear/delete from the shelf; destructive action stays inside the opened tool.
- No network request, account write, analytics event, schema, provider, secret, payment, push, or deploy.
