# CRW — Progress So Far

Status update for the team (noWayHome — Rafat Abdullah 220041102, Mahiul Kabir 220041109, Sohom Sattyam 220041141), based on the current state of `CRW-backend` and `CRW-frontend` against the original proposal (`102_109_141.pdf`).

## Database Choice: File-Based H2

The project runs on **file-based H2 database** (`jdbc:h2:file:./data/crwdb`).

**Why:** Zero external installation or credentials needed. Data persists in `CRW-backend/data/` across backend restarts, while keeping the full demo/grading environment self-contained. The built-in console remains accessible at `/h2-console` for quick data inspection.

## Status Overview

| Module / Feature | Status | Notes |
|---|---|---|
| Project scaffolding (Maven, Spring Boot 3.3.4, Java 17, Vite, React) | Done | H2 file-based persistence configured |
| User Management (CRUD & `/users/me`) | Done | Added `GET /api/v1/users/me` for profile |
| JWT Authentication & Role authority | Done | JWT embeds `role` claim; `ROLE_ADMIN` & `ROLE_RESEARCHER` granted |
| Role-based Access Control (`@PreAuthorize`) | Done | `@EnableMethodSecurity` active; member management restricted to `ADMIN` |
| Auth-specific Error Responses | Done | Custom `RestAuthenticationEntryPoint` returns 401 JSON shape |
| Workspace & Team Management | Done | Membership enforced; auto-adds creator; admin can add & remove members |
| Workspace Member Removal | Done | `WorkspaceMemberSummary` DTO (`id`, `username`) + `DELETE /members/{userId}` |
| Task Tracking & Assignment | Done | Tasks assigned to workspace members (`assignee` ManyToOne); `PATCH /tasks/{id}/assignee` |
| Kanban Board for Tasks | Done | View switcher on `/tasks` toggles between List View and **Kanban Board** with drag & drop |
| Reminders & Deadlines Panel | Done | Dashboard panel categorizing tasks into `Overdue` and `Due soon` with visual badges |
| Meeting Coordination | Done | Create, get, list by workspace, delete; minutes rendered as Markdown |
| Literature Management + Annotations | Done | Create entry, expandable annotation threads attributed to caller JWT |
| Manuscript Development + Versions | Done | Create manuscript, draft version history, Markdown content rendering |
| Global Search | Done | Workspace-wide modal (`GlobalSearchModal.jsx`) querying tasks, literature, manuscripts, and meetings |
| User Profile Page | Done | Dedicated `/profile` route with user identity, role badge, joined workspaces & stats |
| Global Exception Handling | Done | Unified `ErrorResponse` JSON for 400, 401, 403, 404, 409 errors |
| Workspace-aware Navigation | Done | `Navbar.jsx` links to Dashboard, Tasks, Literature, Manuscripts, Meetings, Settings, Profile, Search |

---

## Detailed Component Summary

### Backend Architecture & Hardening

- **User & Auth Management**: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/users/me`. Passwords hashed with BCrypt. Stateless JWT sessions.
- **Security Gaps Closed**:
  - `@EnableMethodSecurity` registered in `SecurityConfig.java`.
  - `@PreAuthorize("hasRole('ADMIN')")` applied to `addMember` and `removeMember` in `WorkspaceController.java`.
  - Custom `RestAuthenticationEntryPoint` handles unauthenticated requests (no/invalid JWT) with `401 Unauthorized` `{timestamp, status, error, message}` JSON response.
- **Workspace & Team Management**: Workspace CRUD, member list exposing `WorkspaceMemberSummary` (`id`, `username`), member removal endpoint (`DELETE /api/v1/workspaces/{id}/members/{userId}`).
- **Task Tracking & Assignment**: Task CRUD, status updates (`TODO`/`IN_PROGRESS`/`COMPLETED`), task assignment to workspace members (`assignee_id` FK to `User`), task reassignment endpoint (`PATCH /api/v1/tasks/{id}/assignee`).
- **Literature Management**: Literature CRUD with cascade-persisted annotations (`POST /{id}/annotations`).
- **Manuscript Development**: Manuscript CRUD with version history (`POST /{id}/versions`) and status transitions (`DRAFT`/`REVIEW`/`FINAL`).
- **Meeting Coordination**: Meeting CRUD (create, get, list, delete) with minutes and key decisions.

### Frontend Pages & Features

- **`Dashboard.jsx`**: Workspace metrics, workspace selector (`WorkspaceManager`), **Upcoming & Overdue** deadline section, recent meetings summary.
- **`Tasks.jsx`**: Toggle view between **Kanban Board** (with drag-and-drop support across `TODO`, `IN_PROGRESS`, `COMPLETED` columns) and **List View**. Task creation with assignee dropdown, task row assignee display, and reassign controls.
- **`WorkspaceSettings.jsx`**: Member list displaying usernames and IDs, role-gated Add Member form, and Admin-only **Remove Member** action.
- **`Profile.jsx`**: Dedicated user profile page displaying initials avatar, username, email, role badge (`ADMIN`/`RESEARCHER`), user ID, joined workspaces summary, and member stats.
- **`GlobalSearchModal.jsx`**: Interactive modal accessible via `Navbar` (Search button / keyboard trigger) searching across tasks, literature, manuscripts, and meetings in the active workspace.
- **`Literature.jsx`**: Literature repository cards, expandable annotation accordions, inline annotation posting.
- **`Manuscript.jsx`**: Manuscript list, draft new version form, expandable version history rendering Markdown content via `react-markdown`.
- **`Meetings.jsx`**: Meeting logs with Markdown minutes rendering and key decisions log.
- **`Navbar.jsx`**: Persistent navigation bar with workspace indicator pill, links to all pages, Global Search button, and logout action.
