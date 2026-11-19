# UI

## Health screen

At `/health`. Needs no session.

Shows:
- [heading] the heading "Health";
- [status] the answer of /operations/health-check, as `API: ok`;
- [pending] before it answers, `API: unknown`;
- [error] an answer other than 200, `API: error`;
- [unreachable] no answer, `API: unreachable`.
- [elsewhere] No other screen shows it (not testable).
