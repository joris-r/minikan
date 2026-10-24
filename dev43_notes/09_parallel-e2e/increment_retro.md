# parallel-e2e: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## A tests-only increment skips Implementation

What happened: the increment changed only e2e tests and their
configuration. The Tests phase did all the work and ran the suite;
Implementation then took two gates to run `make check` and change
nothing. The process has a shape without a Tests phase (refactoring),
but none without Implementation.

Proposal, in the `specification` skill, Exploration step 1, next to
the refactoring: "If the change touches only tests or their tooling,
propose a tests-only increment: no Implementation phase; the Tests
phase runs the full check, and its exit leads to Integration. Once the
human agrees, write \"Tests only.\" at the start of the Scope in
STATE." The `tests` skill's Exit would name Integration as the next
phase for such an increment.
