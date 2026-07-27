# CRW — Progress So Far

Status update for the team (noWayHome — Rafat Abdullah 220041102, Mahiul Kabir 220041109, Sohom Sattyam 220041141), based on the current state of `CRW-backend` and `CRW-frontend` against the original proposal (`102_109_141.pdf`).

## Plan change: PostgreSQL/MySQL → H2

The proposal specifies **PostgreSQL (or MySQL) via Spring Data JPA/Hibernate**. The backend currently runs on **H2, in-memory**, instead.

**Why:** H2 needs zero installation or configuration — no DB server, no credentials, no Docker, nothing to keep in sync across three machines. `mvn spring-boot:run` (or the IDE) just works immediately for anyone who clones the repo, which matters a lot for a 3-person team on a semester deadline. It also keeps the whole grading/demo environment self-contained, with a built-in console at `/h2-console` for quick data inspection.

**Why it's safe to defer the "real" database:** all data access goes through Spring Data JPA/Hibernate, and we haven't written any native/H2-specific SQL. So the entity, repository, and service code is effectively database-agnostic — moving to Postgres/MySQL later should mainly be a `pom.xml` driver swap plus a `datasource` URL/credentials change in `application.yml`, not a rewrite of business logic.

**Current limitation from this choice:** `application.yml` points at `jdbc:h2:mem:crwdb`, which wipes all data on every backend restart. Fine for now (we reseed via API calls for demos/screenshots), but it means nobody should rely on data surviving between sessions yet.

## Status overview

| Module | Status | Notes |
|---|---|---|
| Project scaffolding (Maven, Spring Boot 3.3.4, Java 17) | Done | See H2 note above re: DB choice |
| User Management (CRUD) | Done | — |
| JWT Authentication (login/register) | Done | See gaps below re: roles & "current user" |
| Workspace & Team Management | Done | Membership now enforced on every workspace-scoped operation |
| Task Tracking | Done | — |
| Meeting Coordination | Done | No update endpoint (create/get/list/delete only, as scoped) |
| Literature Management + Annotations | Done | Annotation author now derived from the JWT |
| Manuscript Development + Versions | Done | Version author now derived from the JWT |
| Workspace membership authorization | Done | `WorkspaceAccessGuard` — 403 for non-members |
| Server-side author attribution | Done | `userId` removed from request DTOs |
| Global exception handling | Done | Covers not-found, duplicate, validation, and auth exceptions |
| Auth-specific error responses | Done | Bad credentials / access-denied now use our `ErrorResponse` shape |
| Frontend scaffold + routing + JWT-aware API client | Done | — |
| Register page (UI) | Done | `/register` — posts to `/auth/register`, shows backend field errors |
| Workspace creation & switching (UI) | Done | `WorkspaceManager` + `WorkspaceContext` — active workspace shared across pages |
| Workspace member management (UI) | Done | `/settings` — add-member form gated by JWT role; **UI-only gate, see note below** |
| Task Tracking (UI) | Done | `/tasks` — create, quick status change, delete |
| Literature + Annotations (UI) | Done | `/literature` — create entry, expandable annotations, inline annotation form |
| Manuscript Development (UI) | Done | `/manuscripts` — create manuscript, draft new versions, Markdown-rendered content |
| Markdown rendering | Done | `react-markdown` renders manuscript version content and meeting minutes |
| Meeting Coordination (UI) | Done | `/meetings` — log new meeting form, minutes rendered as Markdown |
| Navigation (workspace-aware) | Done | Navbar links to all 6 pages + shows active workspace name |
| Role-based access control (Admin vs Researcher) | Partial | JWT now carries the role, but no backend endpoint checks it — see note below |
| Reminders, milestones, file upload | Not started | See below |
| Automated tests | Not started | — |

## Fully implemented

**Backend — all six domain modules exist end-to-end (Entity → Repository → Service → Controller → DTOs), following strict layered architecture:**

- **User Management** (`/api/v1/users`) — CRUD, duplicate username/email checks, BCrypt password hashing.
- **Authentication** (`/api/v1/auth`) — `POST /login` (email + password → JWT) and `POST /register` (delegates to User service). JWT via `jjwt` 0.12.6, HMAC-signed, 24h expiry, stateless sessions.
- **Workspace & Team Management** (`/api/v1/workspaces`) — CRUD, add/remove members (many-to-many with `User`).
- **Task Tracking** (`/api/v1/tasks`) — CRUD, status updates (`TODO` / `IN_PROGRESS` / `COMPLETED`), scoped per workspace.
- **Meeting Coordination** (`/api/v1/meetings`) — create/get/list-by-workspace/delete, with minutes and key decisions.
- **Literature Management** (`/api/v1/literature`) — CRUD + collaborative annotations (`POST /{id}/annotations`), cascade-persisted.
- **Manuscript Development** (`/api/v1/manuscripts`) — CRUD + version history (`POST /{id}/versions`) with content, version tag, commit message, and status transitions (`DRAFT` / `REVIEW` / `FINAL`).
- **Global error handling** — consistent JSON error shape for 404 (not found), 409 (duplicates), 400 (validation errors with per-field messages), 401 (bad credentials / other authentication failures), and 403 (access denied).
- **Security baseline** — password hashing, JWT filter, stateless sessions, CORS enabled for the Vite dev origin, H2 console reachable in dev.

**Auth-specific error responses** *(previously listed as partial — now closed):*

`GlobalExceptionHandler` now has three additional handlers: `BadCredentialsException` → 401 with `"Invalid email or password."`; `AccessDeniedException` → 403 using the exception's own message (this is what `WorkspaceAccessGuard` throws, so membership-denial responses now carry our real error shape instead of an empty body); and a catch-all `AuthenticationException` → 401 with `"Authentication failed."` for any other Spring Security auth failure. Verified against the running backend: wrong password, an unregistered email, and a cross-workspace access attempt all now return our standard `{timestamp, status, error, message, fieldErrors}` JSON instead of Spring's default error page.

**Scope note, so this isn't overstated:** this only covers exceptions thrown *inside* application code (service/controller layer) — login failures and our own `AccessDeniedException` from `WorkspaceAccessGuard`. A request with **no token at all** (or an invalid one) is still rejected earlier, by Spring Security's filter chain itself, before the request ever reaches a controller — so `@RestControllerAdvice` can't intercept it, and that case still returns a bare 403 with an empty body rather than 401 with our JSON shape. Fixing that needs a custom `AuthenticationEntryPoint` wired into `SecurityConfig`, which is a separate, still-open change (see below).

**Workspace membership authorization + server-side author attribution** *(previously listed as partial — now closed):*

`SecurityUtils.getCurrentUsername()` reads the authenticated principal out of the `SecurityContextHolder` (throwing `AuthenticationCredentialsNotFoundException` if there is no authenticated user). Since `CustomUserDetailsService` uses the **email** as the principal, the matching `User` is resolved via `UserRepository.findByEmail`. A shared `WorkspaceAccessGuard` component wraps this: `currentUser()` resolves the caller from the JWT, and `requireMember(workspace)` throws `AccessDeniedException("Access Denied: You are not a member of this workspace.")` (HTTP 403) unless the caller is in that workspace's member list.

- Every workspace-scoped read/create/update/delete in `WorkspaceService`, `TaskService`, `MeetingService`, `LiteratureService`, and `ManuscriptService` now calls `requireMember(...)` before touching data. For child resources (task, meeting, literature, manuscript) the workspace is resolved from the entity itself, so operating by entity id is checked too. `GET /workspaces` now returns only workspaces the caller belongs to, rather than everything.
- The `userId` field is **gone** from `AnnotationCreateRequest` and `ManuscriptVersionRequest`. Annotation and manuscript-version authors are taken from the authenticated user instead, so a caller can no longer credit work to someone else.
- **Workspace creation auto-adds the creator as the first member.** This was necessary: with membership enforced, a workspace created with an empty member list could never be accessed or added to by anyone, so the creator would be permanently locked out of their own workspace.

Verified end-to-end against the running backend: a non-member gets 403 on reading a workspace, listing its tasks, annotating its literature, deleting its manuscripts, and adding themselves as a member; that same user succeeds on all of those once an existing member adds them; and annotations/versions come back attributed to whoever's token made the call.

**Frontend:**

- Vite + React scaffold, React Router, axios client pre-configured to attach the JWT and hit `http://localhost:8080/api/v1`.
- Functional **Login** page (real auth call, stores token).
- Functional **Dashboard**, **Literature**, and **Manuscripts** pages — these pull live data from the backend (workspace summary, tasks, literature + annotations, manuscripts + versions) rather than being static mockups.

**Register + Workspace management UI** *(new this round):*

- **`Register.jsx`** (`/register`) — username/email/password/role form, `POST /auth/register`, redirects to `/login` on success. Backend `fieldErrors` (400) and duplicate-account messages (409) are surfaced inline per-field and as a banner.
- **`WorkspaceContext.jsx`** — a small provider wrapping the whole app that holds `workspaces`, `activeWorkspaceId`, and `activeWorkspace`, backed by `GET /workspaces` (which, since the membership fix above, already returns only the caller's workspaces). The active workspace id persists in `localStorage` across reloads. **Dashboard, Literature, and Manuscripts were rewired to read from this context** instead of each independently fetching `/workspaces` and hardcoding "use whichever comes first" — so switching workspaces in one place now updates every page.
- **`WorkspaceManager.jsx`** — embedded at the top of the Dashboard: a dropdown to switch the active workspace, plus a small form to create a new one (`POST /workspaces`), which auto-selects the new workspace via the context.
- **`WorkspaceSettings.jsx`** (`/settings`) — lists the active workspace's members (usernames only — see gap below) and a form to add a member by numeric user ID (`POST /workspaces/{id}/members`).

**Backend change needed to support this:** the task asked to gate the add-member form by "the ADMIN role in their JWT" — but the JWT only carried `sub`/`iat`/`exp` at the time, no role. Rather than fake it, `JwtUtil.generateToken` now also embeds a `role` claim, and `AuthServiceImpl.login` reads it off the `Authentication`'s granted authority before issuing the token. This is purely additive: backend authorization still fully re-derives the user's role from the database on every request via `CustomUserDetailsService` (the JWT's role claim is never trusted for actual access decisions) — it exists only so the frontend has something to read.

**Important gap this surfaces — read before relying on the admin gate:** `authService.isAdmin()` decodes the JWT client-side to decide whether to render the add-member form. That is a **UI convenience, not a security boundary.** `WorkspaceController`'s `addMemberToWorkspace` endpoint itself only checks workspace membership (via `WorkspaceAccessGuard`), not role — so right now, any member of a workspace (not just an ADMIN) can still add another member by calling the API directly, even though the button is hidden for them in the UI. This is the same gap already tracked as "Role-based access control" below; it hasn't gotten any smaller, it's just now visibly relevant because the UI references it. Don't treat "hidden in the UI" as "enforced."

**Bug found and fixed while wiring this up:** `WorkspaceProvider` mounts once at the app root and stays mounted across client-side navigation, so its initial workspace fetch was running once — often *before* login (while unauthenticated), and then never again. Result: right after logging in, the Dashboard would show "you are not a member of any workspace yet" even for users who are, until a manual refresh. Fixed by having `Login.jsx` explicitly call `refreshWorkspaces()` right after a successful login (and `Navbar`'s logout handler call it too, so a second user logging in in the same browser session doesn't briefly see the previous user's workspace list). Verified end-to-end with a scripted browser run: register → login → workspace list populated correctly on first paint, no stale/empty state.

**Task / Literature / Manuscript forms + Markdown rendering** *(new this round — previously listed as "Frontend is read-only" / "Markdown rendering" not started, now closed):*

- **`Tasks.jsx`** (new page, `/tasks`) — create-task form (title, description, status, due date) posting to `POST /tasks`; each task row has a status `<select>` that fires `PATCH /tasks/{id}/status` on change, and a delete button (`DELETE /tasks/{id}`) — both update local state from the response instead of refetching the whole list.
- **`Literature.jsx`** — gained a create-entry form (title, authors, publication year, DOI, URL, summary) posting to `POST /literature`. Each paper card now has a "Show/Hide Annotations" toggle (accordion) instead of always rendering the full annotation list; expanding it reveals an inline form that posts to `POST /literature/{id}/annotations`. Since the backend already returns the full `LiteratureResponse` (with the new annotation included) from that endpoint, the local list just gets that one entry replaced — no refetch needed.
- **`Manuscript.jsx`** — gained a create-manuscript form (title, target journal) posting to `POST /manuscripts`, and a "Draft New Version" form per manuscript (version tag, commit message, Markdown content textarea) posting to `POST /manuscripts/{id}/versions`. Each version in the history list is individually expandable ("View Content") and renders its `content` through `<ReactMarkdown>` (`react-markdown` package) instead of showing raw text — headings, bold/italic, and lists all render correctly, verified with a scripted browser test asserting the output HTML contains real `<strong>`/`<li>` tags, not literal Markdown syntax.
- All three pages read `activeWorkspaceId` from `WorkspaceContext` (no change to that plumbing) and derive their create-payload's `workspaceId` from it, so they automatically follow whichever workspace is active.
- Verified end-to-end with a scripted browser run: created a task, changed its status via the dropdown, deleted it, added a literature entry, expanded it and posted an annotation, created a manuscript, and saved a Markdown version — all confirmed against the live backend, not just visually.

**Scope note:** the task description referred to this page as `src/pages/Manuscripts.jsx` (plural); the existing file is `Manuscript.jsx` (singular, already routed at `/manuscripts`). Updated the existing file in place rather than creating a duplicate — same outcome, no import/route churn.

**Meeting Coordination UI + workspace-aware navigation** *(new this round — previously listed as "no create-UI", now closed):*

- **`Meetings.jsx`** (new page, `/meetings`) — log-new-meeting form (title, date, minutes as a Markdown textarea, key decisions) posting to `POST /meetings`; each logged meeting is displayed as a card with its minutes rendered through `<ReactMarkdown>` and key decisions shown as plain text below. Follows the exact same pattern as `Tasks.jsx`/`Literature.jsx` — reads `activeWorkspaceId` from `WorkspaceContext`, appends the create response to local state instead of refetching.
- **Navigation** — rather than add a separate `Navigation.jsx`/sidebar component, the existing `Navbar.jsx` (already rendered on every authenticated page) was extended in place, since it already *is* the app's single navigation surface and a second parallel nav component would just be dead weight. It now links to all six pages (Dashboard, Tasks, Literature, Manuscripts, Meetings, Settings) and displays the active workspace's name as a pill next to the brand, pulled straight from `WorkspaceContext`'s `activeWorkspace` — so it updates immediately when the user switches workspaces from the Dashboard's `WorkspaceManager` dropdown.
- Routing: `/meetings` added to `App.jsx`, wrapped in `ProtectedRoute` like every other authenticated page.
- Verified end-to-end with a scripted browser run: logged in, confirmed the navbar shows all 6 links and the correct active-workspace name, logged a meeting with Markdown minutes (headings + bullet list), and confirmed the rendered output contains real `<li>`/heading HTML rather than literal Markdown syntax.

With this, every domain module the backend exposes (Users/Auth, Workspaces, Tasks, Literature, Manuscripts, Meetings) now has a corresponding frontend page, and the app is fully navigable from a single persistent nav bar — closing out the "frontend is read-only" gap that's been tracked since the first UI pass.

## Partially implemented — and how to proceed

1. **Role-based access control.** `Role` (`ADMIN` / `RESEARCHER`) exists on `User` and is now on the JWT as both a Spring Security authority (`ROLE_ADMIN` / `ROLE_RESEARCHER`, used internally) and a plain `role` claim (added this round so the frontend can read it) — but **no backend endpoint actually checks it**. The frontend hides the "add member" form from non-admins, but that's cosmetic: `POST /workspaces/{id}/members` itself only checks workspace membership, not role, so any member can still call it directly. *Next step:* add `@PreAuthorize` (or an equivalent check) on admin-only actions — starting with `addMemberToWorkspace`/`removeMemberFromWorkspace`, since those are the ones the UI now implies are admin-only.

2. **Unauthenticated requests return 403, not 401.** A request with no token (or an invalid one) is rejected by Spring Security's filter chain before it reaches a controller, so it never hits `GlobalExceptionHandler` — it still gets a bare 403 with an empty body instead of a proper 401 with our `ErrorResponse` shape. *Next step:* configure a custom `AuthenticationEntryPoint` in `SecurityConfig`.

3. **Workspace member list only shows usernames, not IDs.** `WorkspaceResponse.memberUsernames` is a list of strings, so `WorkspaceSettings` can display who's in a workspace but has no way to let an admin *remove* a member from the UI (`DELETE /workspaces/{id}/members/{userId}` needs a numeric id, which isn't in the response). Adding by ID works because the admin has to already know it. *Next step:* either add member IDs to `WorkspaceResponse`, or add a small "look up user by username" endpoint.

4. **In-memory data.** As covered in the H2 section above — restarting the backend wipes everything. *Next step:* switch to `jdbc:h2:file:` for local persistence, or move to Postgres/MySQL per the original plan, whenever that becomes a priority.

## Not yet implemented

Mapped against the "Key Features" in the proposal:

- **Automated reminders** (under Project & Task Tracking in the proposal) — no scheduler or notification mechanism exists at all.
- **Visual milestone scheduling** — `Task` has a `dueDate`, but there's no milestone/calendar/timeline concept or UI.
- **Paper/file upload** — literature entries only store a URL/DOI reference, not an actual uploaded file.
- **Automated tests** — none exist yet (unit or integration) anywhere in the codebase.
- **Production hardening** — the JWT secret has a hardcoded default in `application.yml` (overridable via `JWT_SECRET` env var but not enforced), no refresh-token/revocation flow, no rate limiting, no logging/observability setup.

## Suggested order of work

1. ~~Add workspace-membership checks in the service layer.~~ **Done.**
2. ~~Derive "current user" from the JWT instead of trusting client-supplied `userId` fields.~~ **Done.**
3. ~~Map auth exceptions to our `ErrorResponse` format~~ **Done** — remaining piece: a custom `AuthenticationEntryPoint` so unauthenticated (no/invalid token) requests return 401 instead of a bare 403.
4. ~~Register + workspace creation/switching/member-management UI.~~ **Done** — remaining piece: enforce the ADMIN check server-side (see item 1 above), since it's UI-only right now.
5. ~~Build create/edit forms on the frontend: new task, new literature entry + annotation, new manuscript version, new meeting.~~ **Done.** Every backend module now has a corresponding frontend page.
6. Add role-based (`@PreAuthorize`) checks for whichever actions should be admin-only — the add/remove-member endpoints are the immediate candidates now that the UI implies that restriction.
7. Decide: stay on H2 (switch `mem` → `file` for persistence) or move to Postgres/MySQL now that the schema has stabilized.
8. ~~Markdown rendering~~ **Done** via `react-markdown` — covers both manuscript versions and meeting minutes.
9. Add tests before submission.
10. Nice-to-haves if time allows: reminders, milestones, member-list-with-IDs (to enable remove-member UI), file upload for papers.
