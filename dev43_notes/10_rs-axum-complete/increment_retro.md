# rs-axum-complete: increment retrospective

Proposed changes to the Dev43 process. Target: the Dev43 plugin.

## A shape for a new implementation of an existing specification

What happened: the increment, like `rs-axum` before it, brought a
backend up to a specification that already existed, checked by shared
suites that already existed. Its Specification phase was technical
only, and its Tests phase wrote no test: it only confirmed that the
suite failed for missing routes. `full` gave an empty phase;
`refactoring` does not fit, since the implementation's behavior
changes.

Proposal: a shape for a new implementation of an existing
specification, e.g. `implementation`: Specification (technical
decisions only), Implementation, Integration. The existing shared
suites are its tests and must pass unmodified, as in a refactoring;
the implementation's own unit tests are written during
Implementation.
