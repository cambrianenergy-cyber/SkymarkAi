# Users Collection: Field & Enforcement Summary (as of 2026-01-02)

| Field                | Required | Source/Usage Location                | Enforcement/Notes                                                                 |
|----------------------|----------|--------------------------------------|-----------------------------------------------------------------------------------|
| uid (userId)         | Yes      | Firestore doc ID, Auth, Memberships  | Used as primary key, referenced in memberships, workspace ownership                |
| email                | Yes      | Auth, Workspace creation             | Used for login, founder identification, and admin scripts                          |
| displayName          | Optional | Auth, UI                             | Used for display purposes, not strictly required                                   |
| photoURL             | Optional | Auth, UI                             | Used for avatars, not required                                                    |
| role                 | Yes      | Memberships, Auth custom claims      | Assigned per workspace (owner, admin, member, founder), also set in custom claims  |
| status               | Yes*     | Memberships, Agents, Workspaces      | Used for membership/agent/workspace status ("active", "inactive", etc.)           |
| createdAt            | Yes      | Memberships, Workspaces, Agents      | Set via serverTimestamp in related collections                                     |
| updatedAt            | Yes      | Memberships, Workspaces, Agents      | Set via serverTimestamp in related collections                                     |
| lastSeenAt           | Optional | Not directly enforced                | May be used for activity tracking, not required                                    |
| defaultWorkspaceId   | Optional | Not directly enforced                | May be set for user experience, not required                                       |
| flags                | Optional | Not directly enforced                | For feature flags or user-specific toggles                                         |
| founder (claim)      | No       | Auth custom claims                   | Set by admin script for specific users, used for founder-only access               |

**Notes:**
- The users collection itself does not have a strict schema in code, but `uid` and `email` are always required for core operations.
- Role and founder status are enforced via workspace memberships and Firebase Auth custom claims, not Firestore rules.
- Status fields are enforced for memberships, agents, and workspaces, but not directly on user documents.
- Disabling a user globally is handled via custom claims or status in related collections, not a direct user field.

---
_Last updated: 2026-01-02 by audit script._
