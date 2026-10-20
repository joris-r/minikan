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

## A backlog for candidates

What happened: after Integration, the human noted that the backend
could use Advanced Alchemy's repositories and services in place of the
hand-written queries. The process has no place for such a point:
`spec/` holds decisions, STATE the current position, and these notes
the process itself. It stays in the human's memory.

Proposal: a short `spec/BACKLOG.md` of candidate increments, one line
each, added only with the human's approval. The agent reads it at the
start of a Specification Exploration and may propose a scope from it.
An entry is removed in the commit of the increment that does it. Any
agent proposal the human does not take up right away goes there,
rather than in a commit message or the agent's memory.

Example of a first entry:

- Backend `py_litestar`: use Advanced Alchemy repositories and
  services instead of the hand-written queries.

## An inactive state between increments

What happened: after the Integration commit, STATE read
Specification · Exploration, but the discussion that followed was about
the process (cost, notes, backlog), not a new increment. The agent
still applied the phase's constraints.

Proposal: the Integration exit sets STATE to an inactive state instead
of Specification · Exploration. While inactive, the agent is free of
the process constraints. The next state is Specification · Exploration,
when the human starts a new increment.

Open points:

- What the agent may change while inactive, e.g. anything, or nothing
  in `spec/` and `tests/`.
- How work done while inactive enters the process, e.g. reviewed at
  the start of the next Specification.
