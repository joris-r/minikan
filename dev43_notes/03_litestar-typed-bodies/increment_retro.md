# litestar-typed-bodies: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## Sketch the code of a refactoring before agreeing on it

What happened: a first increment, `litestar-dtos`, replaced the
hand-built bodies of `py_litestar` with Litestar DTOs. It was abandoned
during Implementation: for two-field bodies, seven DTO configs, string
include paths and a field-ordering mixin cost more than listing fields
by hand. The human's expectation of the refactoring's value turned out
wrong, and a ten-line sketch of explicit structs made that visible at
once. This increment was restarted from it.

Proposal, in the Specification skill: for a refactoring increment (no
behavior change), Exploration shows a short before/after excerpt of the
code before the scope is approved.

## Abandoning an increment

What happened: Dev43 has returns but no abandonment. The agent
improvised a clean-up in the working tree; the human preferred a
`git reset --hard`, which also dropped a backlog entry approved in the
meantime, restored afterwards.

Proposal, in `CLAUDE.md` and the Implementation skill: an "Abandon"
procedure, decided by the human, from any phase:

1. The agent lists what to keep from the increment (backlog entries,
   retrospective notes).
2. It returns to the commit before the increment's first commit:
   `git reset --hard` if nothing was pushed, `git revert` otherwise.
3. It re-applies what is kept, sets Phase to Idle, and records the
   lesson in the backlog or a retrospective, so that a rejected idea
   does not come back.

## Refactoring increments, again

What happened: as in `litestar-layers`, the Tests phase found nothing
to test, twice in a row (`litestar-dtos`, then this increment).

Proposal: see the `litestar-layers` retrospective (go straight from
Specification to Implementation when no test is needed); this
increment confirms it.
