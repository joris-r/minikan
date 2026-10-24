# Dev43 state

Updated only on the human's explicit decision.

- Increment: lax-integers
- Phase: Implementation
- Step: Exploration

## Scope of the current increment

Remove strict integer decoding from py_litestar and use the default lax decoding. The 400 rule and the shared suites cover only values no backend may accept; `technical.md` notes that py_litestar also accepts integers written as strings or floats.
