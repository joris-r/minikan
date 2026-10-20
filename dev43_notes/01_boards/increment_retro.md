# boards: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin; the
project's `CLAUDE.md` is left to the plugin author.

## Uncommitted work during a return from Implementation

What happened: during Verification of Implementation, moving the API
status to `/health` needed a return to Specification. The rules did not
say what becomes of the uncommitted implementation work meanwhile.
Taken literally, the `git add -A` of the return's exit commits would
have swept it into `[boards] Specification (return)`. We stashed it
instead. Two snags:

- The intent-to-add marks left by `git add -N .` made `git stash` fail
  until they were cleared with `git reset`.
- Restoring the stash had to skip what the return phases had already
  committed (the change page, STATE, a test config line).

Proposal, in the Git section:

> On a return from Implementation, stash the work
> (`git stash push -u`) and note the stash in STATE. When
> Implementation resumes, restore it except what the return phases
> committed (`spec/`, `tests/`), then drop the stash.

## One short command per gate

The human approved gates with varied words ("ok", "next", "proceed",
"start production", "yes"). An answer like "proceed" right after a
question, or "nice" during a review, left it unclear whether a gate was
passed.

Proposal: agree on one short, specific command that passes the gate in
front of the agent (next step or next phase), and treat anything else
as discussion.

## Drop `git add -N .`

The human's git GUI already shows new files, so marking them with
intent-to-add brings little. It also blocks `git stash` (see above).
The only case it covers is a new file matched by `.gitignore`, which
is rare.

Proposal: remove the `git add -N .` step from the hand-overs and from
the Git rules. This also removes the `git reset` step from the stash
procedure above.

## New tests that already pass

What happened: in the Tests return, the changed health test (`API: ok`
on `/health`) passed before any implementation change. It is not a
negative check: the existing code met it by accident, as it showed the
status on every screen.

Proposal, in the Tests skill, where it requires a new test that
already passes to be a legitimate negative check: add "or a positive
check the existing code already meets; say why in the hand-over".
