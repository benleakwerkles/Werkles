# No-Mule Completion Rule

For GREEN local tasks, "Ben should run this command" is not a valid completion state.

Completion must return at least one executable or inspectable artifact:

- a double-click launcher
- a local button
- a generated file
- a receipt
- a verified clipboard packet
- a screenshot or readback proving the action happened

If a command is required, the operator-facing deliverable must wrap it as a click-ready launcher or script and return the launcher path plus a receipt. CLI commands may be documented for maintainers, but they cannot be the only completion path for Ben.

Human gates are allowed only when the action crosses a real boundary such as credentials, secrets, payment, account authority, production deploy, deletion, or unclear consent.
