# Dev43 rules

This project follows the Dev43 process. These rules restrict what you
may do. They override your defaults. When a rule and a request conflict,
stop and ask the human.

Golden rule: humans make every important or impactful decision.

Silver rule, its dual: a statement belongs in the specification only if
a competent agent could reasonably have chosen otherwise and the human
would care.

## State and gates

- Before any work, read `spec/STATE.md`. Start every message with
  `[<Phase> · <Step>]` as recorded there at the end of the message.
- Do only the work of the current phase and step. Use the matching
  `dev43:<phase>` skill.
- Never advance the step or phase yourself, except from Production to
  Verification at your hand-over. You may say a step looks complete;
  only the human decides.
- A plain approval with no change request ("ok", "agree", "go") is the
  human's decision to pass the gate in front of you. Say in your reply
  which gate you passed:
  - in Exploration, after you proposed to end it: Exploration is over,
    start Production;
  - in Verification, once the checks pass and no tag remains: the
    review is approved and the human gives the go for the exit commit.
- Production ends when you hand over. First run the checks of the
  phase (see its skill) and fix what fails: the human reviews only work
  that passes them. Then mark new files with `git add -N .` (see Git),
  set Step to Verification in STATE, and hand over with the check
  results and your tags (file and line), with one line on each saying
  why.
- Verification: the human reviews. They rule on each tag or edit the
  artifacts directly; you apply the rulings, remove the tags and run
  the checks again. The step is complete when the checks pass, no tag
  remains (see Tags), and the human approves.
- If you meet a major decision that calls into question what was agreed,
  stop working, explain it, and propose a return to Exploration. Never
  work around it. If the human agrees, set Step to Exploration in STATE.

## Tags

A tag draws the human's attention to a choice you are unsure of, and
records that they must act on it.

- Tag `@dev43:unsure` each choice that neither the specification nor
  the human dictated and that you doubt, on the line where it applies
  (spec, test or code). A test you believe is wrong is always tagged.
- Do not tag choices you are confident of: the human sees them in the
  review. One the human would care about belongs in the specification
  (silver rule), which they read in full.
- Tag a choice once, at its most authoritative place: spec before test
  before code. A ruling on that tag rules on the choice everywhere.
- Write the choice itself as normal content: the artifact must read
  correctly once the tag is removed. Put nothing else in the tag, no
  kind, ID or explanation; explanations go in your hand-over message.
- In Markdown, put the tag in an HTML comment: `<!-- @dev43:unsure -->`.
  In code, put it in a comment on its own line, just above the
  statement, so that removing it leaves the formatting unchanged.
- The human accepts a tag by removing it, and rejects it by changing
  the content (or asking you to). Never remove a tag yourself unless
  the human has ruled on it.
- No tag remains when both commands print nothing:
  `git diff HEAD | grep '^+.*@dev43:'` and
  `git ls-files -o --exclude-standard -z | xargs -0 -r grep -Hn '@dev43:'`.
  Committed content never holds a real tag, so tags quoted in committed
  documents do not count. To quote a tag in a new document, write
  `@dev43\:`.

## Specification

- Write the minimum, by the silver rule. Everything else is derived by
  agents, in tests and code. Tag what you are unsure of instead of
  specifying it.
- A decision states what is decided, not why. Give reasons in your
  hand-over message and in the commit message of the phase, never in
  the specification.
- Data model first: entities, their fields and constraints, and their
  relations. It sets the vocabulary: everything else refers to things
  by these names, and to commands, endpoints or screens by theirs.
- Prefer examples (a terminal session, a request and its response, a
  sample file) to prose. Add a few rules for what the examples do not
  show.
- Use nested lists, never tables.
- Give an ID only to a free-text rule that a test or code must cite and
  that no name already identifies: `R<n>:` at the start of its list
  item, e.g. `- R4: On error, the data file is left unchanged.` Numbers
  are project-wide: a new rule takes one above the highest ever used,
  in `spec/` or in its history (`git log -p -- spec`). Never reuse a
  number.
- A point discovered after the Specification phase:
  - the human would not care (silver rule): code only;
  - it belongs in the specification but needs no new test (e.g. a
    technical decision): write it in the change page, tagged; it is
    reviewed and committed with the current phase;
  - new behavior that one or two new tests can check: an Amendment
    (see the Implementation skill);
  - anything larger, or a change to what was agreed: propose a return.
  Never leave it only in your memory or a commit message.
- Layout:
  - `spec/main/`: the main specification. `data-model.md`,
    `technical.md` (stack, conventions, test and quality policy), and
    one page per feature area, named with the human.
  - `spec/changes/<slug>.md`: the change specification of the current
    increment, one page.

## Tests and code

- Tests cite what they check: a name from the specification (in the
  test name or its grouping) or a rule ID.
- Code cites a rule ID only where it explains something the reader
  would not otherwise see.
- Never copy specification text into tests or code.
- During Implementation, never change test code. If a test seems wrong,
  tag it `unsure`, explain why in your hand-over, and continue. Adding
  the tag, and removing it once the human has ruled, are the only
  allowed edits.
- Add no dependency, library, service or interface unless the
  specification names it or you tag it.

## Working with the human

- Exploration is a discussion, not a report. One point per message, a
  few sentences at most, then wait for the answer. Ask one question or
  make one proposal; let the answer decide what comes next.
- Raise only what you cannot settle with confidence: the human's goals
  and preferences, real trade-offs, choices you doubt. If you would
  recommend something with confidence, don't ask; make the choice in
  Production.
- No numbered lists of decisions, no option surveys up front. Bring
  alternatives only when the human asks or a trade-off needs them.
- A skill's list of Exploration topics is your agenda, not a message
  template.
- A point you made that the human did not react to counts as accepted.
- When you have nothing left to raise, propose to end Exploration.
- Production: work without interrupting; tag instead.

## Git

- The project is a git repository. Use it: `git diff` is what remains
  to review, `git diff --cached` what the human has already reviewed,
  `git diff HEAD` the work of the current phase, `git log` the history.
- The index belongs to the human, who stages each file or hunk once
  read. Never stage, except: at the end of Production, mark new files
  with `git add -N .` so they show in `git diff`; and at the exit
  commit.
- Commit only at the end of a phase, on the human's go, after updating
  STATE: `git add -A`, then commit as `[<increment>] <phase>`,
  with a short body giving the reasons for the phase's main decisions.
  A phase done again after a return ends its subject with ` (return)`.
  The only other commit is an Amendment during Implementation (see its
  skill). Never commit at any other time.
