# Runtime fixes and assistant upgrade

## Authentication

The November 24 browser reproduction used a token with an invalid signature. Spring's default entry point returned 403 for the anonymous request, and Axios retained the token because its recovery handled only 401. The original manually observed token's rejection reason could not be established retrospectively.

The configured entry point now returns 401 for missing or rejected authentication. The shared client clears only the rejected current session and redirects to login with a session-expired message. Authorization failures retain 403. Stable local secrets are loaded from ignored local configuration.

Phase 6 adds the immutable account ID to newly issued JWTs. Requests verify it against the stored account. This prevents a token belonging to a deleted account from authorizing a new account registered with the same email. Existing tokens without this claim require one fresh login.

DELETE `/api/profile` requires the current password and the exact confirmation `DELETE`. The database transaction deletes account-scoped data through existing cascading foreign keys, including private attachment rows and conversation records. Anonymous survey responses are independent. Database backup retention remains an operator responsibility.

Per-instance request limits cover authentication, survey submissions and account deletion. They use the socket peer address and ignore forwarded identity headers. Proxy deployments need an appropriate trusted ingress limit because multiple clients can share one socket peer.

The browser retries only read requests automatically. Write requests can have completed before a network timeout and therefore require explicit user recovery.

## Verification in progress

Java 17 `mvn.cmd -B clean verify` passed with disposable PostgreSQL at port 55433. Eleven tests passed, including account deletion, rejected-password handling, old-token rejection after email reuse, and rate-limit checks. The Python suite passed 51 checks with two skips before the optional plotting dependency was installed. Six of these checks cover conversational claim validation.

The floating assistant, native startup and Docker integration are undergoing final verification. Live provider and native vector verification require separate evidence before sign-off.
