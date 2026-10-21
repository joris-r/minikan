# litestar-layers: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## Refactoring increments

What happened: the increment restructured the `py_litestar` backend
without changing its behavior. The Tests phase only found that there
was nothing to test, plus one moved import; its gates and commit cost
more than they brought.

Proposal: when the human is sure no test is needed (the behavior is
unchanged and the existing suites pass unmodified), go straight from
Specification to Implementation. The few edits existing tests need
(e.g. a moved import) are then made during Implementation, tagged.

## Retrospective on the project, not only the process

What happened: the retrospective questions the process at every
increment, which is useful while Dev43 is young but becomes a ritual.
Meanwhile, nothing invites stepping back on the project itself; this
time it led to a strategy and a set of backlog entries.

Proposal: the Integration retrospective covers two topics:

- the project, at every increment: technical debt, architecture, what
  was learned, and what follows for the backlog;
- the process, only when something went wrong during the increment.
