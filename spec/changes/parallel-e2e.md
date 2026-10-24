# parallel-e2e: run the e2e suite in parallel

Each shared test checks only what it created, so the e2e suite runs its
tests in parallel.

## Technical

### Tests and quality

Replaces "The shared suites never assume an empty storage: they check
only what they created.":

- The shared suites never assume an empty storage: each test checks
  only what it created. The e2e suite runs its tests in parallel.
