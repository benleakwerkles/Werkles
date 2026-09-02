# Vision — Match Deck to Alignment Memo Bridge

Date: 2026-08-21  
Lane: Werkles Matching → Personal Bellows  
Executor: Dink@Betsy  
Review requested from: Ender, Bean, Petra, and Doozer

## Product problem

The Match Deck practice conversation currently ends after four answers. It helps a member inspect a possible fit but does not carry that work into a durable next step. The Partnership Alignment memo now exists, but it opens without any explanation of why the member arrived there.

## Candidate

Add a device-only bridge from the selected synthetic practice profile to the Partnership Alignment memo. Carry only validated synthetic context: profile ID, display name, role, up to four stated offers, and up to four stated needs. Show that context above the memo as questions to compare; never fill the member's answers automatically.

## Hard edges

- Synthetic profile context only; never label it a real member or introduction.
- No network call, account save, shared record, contact, proof, agreement, or consent claim.
- Untrusted local storage must be validated and bounded before display.
- The member's ten answers stay theirs and remain blank until they write them.
- No production, schema, provider, secret, payment, push, or deploy action.

## Verification

Pure validator/build contract, source integration smoke, browser context display plus save/reload/clear, TypeScript, diff integrity, and existing ghost interaction regressions.
