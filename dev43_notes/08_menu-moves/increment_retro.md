# menu-moves: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## Only the Tests phase's tests are read-only

What happened: in Implementation, the frontend's own unit tests
checked that the Actions menu held only "Delete". The `CLAUDE.md`
rule "During Implementation, never change test code" forbade updating
them, while `technical.md` hands an implementation's unit tests to the
Implementation phase. The agent first shaped the component around the
old unit test to avoid the conflict.

Proposal, in the `CLAUDE.md` template, under "Tests and code": "During
Implementation, never change test code written during the Tests
phase." Applied to this project's `CLAUDE.md` meanwhile.
