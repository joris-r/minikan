# lax-integers: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## Specification is refined, not matched

What happened: in the ordering increment, the specification answered
400 when `position` is "not an integer", which made `"1"` an error.
The shared suite tested it, and py_litestar added code only to rule
out what msgspec accepts by default, against its idiom. Tests show
that specified behavior is present; they cannot show that unspecified
behavior is absent, so such a rule constrains the implementation
without being checkable.

Proposals:

- In the `CLAUDE.md` template, under "Specification": "Specification,
  tests and implementation are linked by refinement: an implementation
  may behave beyond what is specified. State each rule as an
  observable outcome over the specified domain, never as an absence;
  behavior outside that domain is left unspecified." Applied to this
  project's `CLAUDE.md` meanwhile.
- In the `specification` skill, Production list: "State behavior as
  what a client observes at the interface (a response, a screen, a
  file), never as internal state or an absence: e.g. \"on error, the
  data file is the same after the operation as before\", not \"the
  data file is left unchanged\"."
- The rule ID example of the `CLAUDE.md` template, "On error, the data
  file is left unchanged.", would then read better in its positive
  form.

## Going further, in Integration

What happened: this project's `CLAUDE.md` asked for a "Going further"
section in the Implementation hand-over. There it falls short: the
human is reviewing the code and passing a gate, and has no room to
take a lead up.

Proposal, in the `integration` skill, as a third Exploration topic:
"Going further: two or three leads drawn from the increment's actual
work, never generic: a concept or pattern at play (e.g. Data Mapper vs
Active Record), or a quality or security point worth examining. The
human picks one or none; nothing is committed and the gate does not
depend on it." Removed from this project's `CLAUDE.md`, which keeps
only that the goal of the project is learning.

## Fold an empty Exploration into the exit gate

What happened: the increment passed 8 gates for 28 removed lines.
Three of them ended an Exploration where the agent had nothing, or
almost nothing, to raise (Tests, Implementation, Integration): a round
trip in which nothing was decided.

Proposal, in the `CLAUDE.md` template, under "State and gates": "When
you propose an exit and foresee nothing to raise in the next phase's
Exploration, say so: `next` then makes the exit commit, ends that
Exploration and starts its Production." The human still decides each
gate, with one word for both; any answer other than `next` keeps the
Exploration open.
