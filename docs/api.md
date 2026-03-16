# TaskFlow API Reference

All API endpoints are prefixed with `/api`. Unless noted, every endpoint requires an active session (obtained via the login flow). Unauthenticated requests return `401 Unauthorized`.

---

## Authentication

### Register

**`POST /api/register`**

Creates a new user account. No session required.

**Request body**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secret123"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | No | Min 2 characters |
| `email` | string | Yes | Must be a valid email |
| `password` | string | Yes | Min 6 characters |

**Responses**

`201 Created`
```json
{
  "user": {
    "id": "cuid",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `409` | Email already registered |
| `500` | Unexpected server error |

---

### Login

**`POST /api/auth/callback/credentials`**

Handled by NextAuth. Submit `email` and `password` as form fields or use the `signIn("credentials", { email, password })` helper from `next-auth/react` on the client.

On success, NextAuth sets a session cookie. On failure, returns an error via the NextAuth redirect flow.

---

### Logout

Handled by NextAuth. Call `signOut()` from `next-auth/react` on the client. Clears the session cookie and redirects to `/login`.

---

## Projects

### List my projects

**`GET /api/projects`**

Returns all projects where the authenticated user is a member (owner or member), ordered by when they joined.

**Response `200 OK`**

```json
{
  "projects": [
    {
      "id": "cuid",
      "name": "Website Redesign",
      "description": "Q1 redesign project",
      "createdAt": "2026-03-16T00:00:00.000Z",
      "role": "OWNER"
    }
  ]
}
```

---

### Create a project

**`POST /api/projects`**

Creates a new project. The authenticated user is automatically assigned as `OWNER`.

**Request body**

```json
{
  "name": "Website Redesign",
  "description": "Q1 redesign project"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | Min 1, max 100 characters |
| `description` | string | No | Max 500 characters |

**Response `201 Created`**

```json
{
  "project": {
    "id": "cuid",
    "name": "Website Redesign",
    "description": "Q1 redesign project",
    "createdAt": "2026-03-16T00:00:00.000Z",
    "updatedAt": "2026-03-16T00:00:00.000Z"
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed |

---

### Get a project

**`GET /api/projects/:projectId`**

Returns a single project with its total member count. Caller must be a project member.

**Response `200 OK`**

```json
{
  "project": {
    "id": "cuid",
    "name": "Website Redesign",
    "description": "Q1 redesign project",
    "createdAt": "2026-03-16T00:00:00.000Z",
    "updatedAt": "2026-03-16T00:00:00.000Z",
    "_count": {
      "members": 3
    }
  }
}
```

| Status | Reason |
|---|---|
| `403` | Caller is not a project member |
| `404` | Project not found |

---

### Update a project

**`PATCH /api/projects/:projectId`**

Updates a project's name and/or description. Caller must be the project `OWNER`. All fields are optional.

**Request body**

```json
{
  "name": "Website Redesign v2",
  "description": "Updated scope"
}
```

**Response `200 OK`**

```json
{
  "project": {
    "id": "cuid",
    "name": "Website Redesign v2",
    "description": "Updated scope",
    "updatedAt": "2026-03-16T00:00:00.000Z"
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `403` | Caller is not the project owner |

---

### Delete a project

**`DELETE /api/projects/:projectId`**

Permanently deletes a project. Caller must be the project `OWNER`. All associated members, tasks, and comments are deleted via cascade.

**Response `204 No Content`**

| Status | Reason |
|---|---|
| `403` | Caller is not the project owner |

---

## Members

### List members

**`GET /api/projects/:projectId/members`**

Returns all members of a project. Caller must be a project member.

**Response `200 OK`**

```json
{
  "members": [
    {
      "userId": "cuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "OWNER",
      "joinedAt": "2026-03-16T00:00:00.000Z"
    },
    {
      "userId": "cuid",
      "name": "Bob Jones",
      "email": "bob@example.com",
      "role": "MEMBER",
      "joinedAt": "2026-03-16T00:00:00.000Z"
    }
  ]
}
```

| Status | Reason |
|---|---|
| `403` | Caller is not a project member |

---

### Invite a member

**`POST /api/projects/:projectId/members`**

Invites an existing platform user to the project by email. Caller must be the project `OWNER`.

**Request body**

```json
{
  "email": "bob@example.com"
}
```

**Response `201 Created`**

```json
{
  "member": {
    "userId": "cuid",
    "name": "Bob Jones",
    "email": "bob@example.com",
    "role": "MEMBER",
    "joinedAt": "2026-03-16T00:00:00.000Z"
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `403` | Caller is not the project owner |
| `404` | No user with that email exists on the platform |
| `409` | User is already a member of the project |

---

### Remove a member

**`DELETE /api/projects/:projectId/members/:userId`**

Removes a member from the project. Caller must be the project `OWNER`. The owner cannot remove themselves — delete the project instead.

**Response `204 No Content`**

| Status | Reason |
|---|---|
| `400` | Caller attempted to remove themselves |
| `403` | Caller is not the project owner |

---

## Tasks

### List tasks for a project

**`GET /api/projects/:projectId/tasks`**

Returns all tasks in a project, ordered newest first. Caller must be a project member.

**Query parameters**

| Parameter | Values | Description |
|---|---|---|
| `status` | `TODO`, `IN_PROGRESS`, `DONE` | Filter by status |
| `priority` | `LOW`, `MEDIUM`, `HIGH` | Filter by priority |

**Example**

```
GET /api/projects/cuid/tasks?status=IN_PROGRESS&priority=HIGH
```

**Response `200 OK`**

```json
{
  "tasks": [
    {
      "id": "cuid",
      "title": "Design homepage",
      "description": "Create mockups",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2026-04-01T00:00:00.000Z",
      "projectId": "cuid",
      "createdAt": "2026-03-16T00:00:00.000Z",
      "updatedAt": "2026-03-16T00:00:00.000Z",
      "assignees": [
        {
          "taskId": "cuid",
          "userId": "cuid",
          "user": {
            "id": "cuid",
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        }
      ],
      "_count": {
        "comments": 2
      }
    }
  ]
}
```

| Status | Reason |
|---|---|
| `403` | Caller is not a project member |

---

### Create a task

**`POST /api/projects/:projectId/tasks`**

Creates a new task within a project. Caller must be a project member. All `assigneeIds` must be current project members.

**Request body**

```json
{
  "title": "Design homepage",
  "description": "Create mockups for the new homepage",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2026-04-01",
  "assigneeIds": ["cuid", "cuid"]
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `title` | string | Yes | Min 1 character |
| `description` | string | No | — |
| `priority` | string | Yes | `LOW`, `MEDIUM`, or `HIGH` |
| `status` | string | No | `TODO`, `IN_PROGRESS`, or `DONE`. Defaults to `TODO` |
| `dueDate` | string | No | ISO date string (e.g. `"2026-04-01"`) |
| `assigneeIds` | string[] | No | Array of user IDs — each must be a project member. Defaults to `[]` |

**Response `201 Created`**

```json
{
  "task": {
    "id": "cuid",
    "title": "Design homepage",
    "description": "Create mockups for the new homepage",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-04-01T00:00:00.000Z",
    "projectId": "cuid",
    "createdAt": "2026-03-16T00:00:00.000Z",
    "updatedAt": "2026-03-16T00:00:00.000Z",
    "assignees": [
      {
        "taskId": "cuid",
        "userId": "cuid",
        "user": {
          "id": "cuid",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ]
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed, or one or more assigneeIds are not project members |
| `403` | Caller is not a project member |

---

### Get a task

**`GET /api/projects/:projectId/tasks/:taskId`**

Returns a single task with its assignees and full comment thread. Caller must be a project member.

**Response `200 OK`**

```json
{
  "task": {
    "id": "cuid",
    "title": "Design homepage",
    "description": "Create mockups",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2026-04-01T00:00:00.000Z",
    "projectId": "cuid",
    "createdAt": "2026-03-16T00:00:00.000Z",
    "updatedAt": "2026-03-16T00:00:00.000Z",
    "assignees": [
      {
        "taskId": "cuid",
        "userId": "cuid",
        "user": { "id": "cuid", "name": "Jane Smith", "email": "jane@example.com" }
      }
    ],
    "comments": [
      {
        "id": "cuid",
        "content": "Started on the mockups",
        "createdAt": "2026-03-16T00:00:00.000Z",
        "user": { "id": "cuid", "name": "Jane Smith" }
      }
    ]
  }
}
```

| Status | Reason |
|---|---|
| `403` | Caller is not a project member |
| `404` | Task not found |

---

### Update a task

**`PATCH /api/projects/:projectId/tasks/:taskId`**

Updates a task. Caller must be a project member. All fields are optional. If `assigneeIds` is provided, it **replaces** the full assignee list — pass an empty array to remove all assignees.

**Request body**

```json
{
  "status": "IN_PROGRESS",
  "assigneeIds": ["cuid"]
}
```

| Field | Type | Rules |
|---|---|---|
| `title` | string | Min 1 character |
| `description` | string | — |
| `priority` | string | `LOW`, `MEDIUM`, or `HIGH` |
| `status` | string | `TODO`, `IN_PROGRESS`, or `DONE` |
| `dueDate` | string | ISO date string, or `null` to clear |
| `assigneeIds` | string[] | Replaces existing assignees. Each must be a project member |

**Response `200 OK`**

```json
{
  "task": {
    "id": "cuid",
    "title": "Design homepage",
    "status": "IN_PROGRESS",
    "assignees": [...]
  }
}
```

| Status | Reason |
|---|---|
| `400` | Validation failed, or one or more assigneeIds are not project members |
| `403` | Caller is not a project member |

---

### Delete a task

**`DELETE /api/projects/:projectId/tasks/:taskId`**

Permanently deletes a task and all its comments. Caller must be a project member.

**Response `204 No Content`**

| Status | Reason |
|---|---|
| `403` | Caller is not a project member |

---

## Cross-project task view

### List all my tasks

**`GET /api/tasks`**

Returns all tasks across every project the authenticated user is a member of, ordered newest first. Useful for building a personal "all tasks" view.

**Response `200 OK`**

```json
{
  "tasks": [
    {
      "id": "cuid",
      "title": "Design homepage",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2026-04-01T00:00:00.000Z",
      "projectId": "cuid",
      "createdAt": "2026-03-16T00:00:00.000Z",
      "updatedAt": "2026-03-16T00:00:00.000Z",
      "assignees": [
        {
          "taskId": "cuid",
          "userId": "cuid",
          "user": { "id": "cuid", "name": "Jane Smith", "email": "jane@example.com" }
        }
      ],
      "project": {
        "id": "cuid",
        "name": "Website Redesign"
      }
    }
  ]
}
```

> This endpoint returns tasks from projects the caller is a **member of**, not tasks specifically assigned to the caller. To find tasks assigned to a specific user, filter the results by `assignees[].userId`.
