# Relational Integrity Validation Guide

## Overview

Relational integrity ensures that relationships between data entities remain consistent and valid. This document outlines all validations in place for the taskflow application.

## Database-Level Constraints

### Foreign Key Constraints
All foreign key relationships include cascade delete rules:

```
User → ownedProjects: Project
User → projectMembers: ProjectMember
User → assignedTasks: Task
User → comments: Comment

Project → tasks: Task (onDelete: Cascade)
Project → members: ProjectMember (onDelete: Cascade)

ProjectMember → project: Project (onDelete: Cascade)
ProjectMember → user: User (onDelete: Cascade)

Task → project: Project (onDelete: Cascade)
Task → assignee: User (optional, set to NULL on delete)
Task → comments: Comment (onDelete: Cascade)

Comment → task: Task (onDelete: Cascade)
Comment → user: User (onDelete: Cascade)
```

### Unique Constraints
- `User.email` - Users must have unique email
- `ProjectMember(projectId_userId)` - User can only be member of project once

## API-Level Validations

### 1. Authentication Check
**Applied to**: All protected endpoints
```
→ Verify session.user.id exists
→ Return 401 Unauthorized if missing
```

### 2. Authorization Checks

#### assertProjectMember(projectId, userId)
**Purpose**: Verify user is a member of the project
**Applied to**: Most project operations
```
→ Find ProjectMember by (projectId, userId)
→ Return 403 Forbidden if not found
```

#### assertProjectOwner(projectId, userId)
**Purpose**: Verify user is the project owner
**Applied to**: Project deletion, member management
```
→ Check ProjectMember membership
→ Verify role === "OWNER"
→ Return 403 Forbidden if not owner
```

### 3. Relational Integrity Checks

#### validateTaskBelongsToProject(taskId, projectId)
**Purpose**: Ensure task exists in the project
**Applied to**: Task PATCH/DELETE operations
```
→ Find Task by (id, projectId)
→ Return 400 Bad Request if mismatch
```

#### validateAssigneeIsProjectMember(assigneeId, projectId)
**Purpose**: Ensure assignee is a valid project member
**Applied to**: Task creation/update with assignee
```
→ Find ProjectMember by (projectId, assigneeId)
→ Return 400 Bad Request if not member
```

#### validateCommentBelongsToProject(commentId, projectId)
**Purpose**: Ensure comment is on a task in the project
**Applied to**: Comment operations
```
→ Find Comment with task.projectId match
→ Return 404 Not Found if mismatch
```

#### validateUserIsMember(userId, projectId)
**Purpose**: Verify user membership
**Applied to**: Member operations
```
→ Find ProjectMember by (projectId, userId)
→ Return 403 Forbidden if not member
```

### 4. Resource Existence Checks

- **validateProjectExists(projectId)** - 404 if not found
- **validateTaskExists(taskId)** - 404 if not found
- **validateUserExists(userId)** - 404 if not found
- **validateCommentExists(commentId)** - 404 if not found

### 5. Business Logic Validations

#### Comment Author Verification
```
→ Only comment author can delete their own comment
→ Return 403 Forbidden if not author
```

#### Self-Removal Prevention
```
→ Prevent user from removing themselves from project
→ Return 400 Bad Request with helpful message
```

#### Orphaned Task Detection
```
Function: getOrphanedTasksAfterMemberRemoval(userId, projectId)
→ Find all tasks assigned to member
→ Allows handling reassignment before removal
```

## Cascade Delete Behavior

When deleting entities, cascades work as follows:

### Delete Project
```
Project (deleted)
  ├─ ProjectMembers (all deleted) → orphaned tasks resolved
  ├─ Tasks (all deleted)
  │   └─ Comments (all deleted)
  └─ Membership records cleaned up
```

### Delete User (would be user deletion, not in current app)
```
User (deleted)
  ├─ ProjectMember records (cascade deleted)
  ├─ Assigned Tasks (kept, assignee set to NULL)
  ├─ Comments (cascade deleted)
  └─ Owned Projects (cascade deleted)
```

### Delete Task
```
Task (deleted)
  └─ Comments (all deleted)
     └─ Comment records cascade deleted
```

### Delete ProjectMember
```
ProjectMember (deleted)
  → Tasks assigned to user remain (orphaned)
  → These are detected by getOrphanedTasksAfterMemberRemoval()
```

## Query Optimization Indexes

Relational integrity is enhanced by indexes supporting common relationship lookups:

```
Task:
  - (projectId) - Find tasks in project
  - (assigneeId) - Find assigned tasks
  - (projectId, status) - Filter tasks
  - (projectId, createdAt) - Sort tasks

Comment:
  - (taskId) - Find comments for task
  - (userId) - Find user's comments
  - (taskId, createdAt) - Fetch and sort comments

ProjectMember:
  - (userId) - Find user's projects
  - (projectId) - Find project members
  - (projectId, userId) UNIQUE - Membership lookup
```

## Usage in API Endpoints

### Example: Update Task
```typescript
// 1. Authenticate user
const session = await getServerSession();
if (!session?.user?.id) return 401;

// 2. Verify project membership
const { error } = await assertProjectMember(projectId, session.user.id);
if (error) return 403;

// 3. Verify task belongs to project
const { valid } = await validateTaskBelongsToProject(taskId, projectId);
if (!valid) return 400;

// 4. If assigning, verify assignee is member
if (data.assigneeId) {
  const { valid } = await validateAssigneeIsProjectMember(data.assigneeId, projectId);
  if (!valid) return 400;
}

// 5. Perform update
await db.task.update({ where: { id: taskId }, data: {...} });
```

## Best Practices

1. **Always verify relationships** - Never assume data is valid across relationships
2. **Use cascade deletes carefully** - Understand what gets deleted
3. **Check before deletion** - Call `getOrphanedTasksAfterMemberRemoval()` before removing members
4. **Validate foreign keys** - Ensure IDs being used as foreign keys exist
5. **Be specific in queries** - Include projectId when querying tasks to ensure scoping
6. **Handle NULL assignees** - Tasks can have NULL assignees, handle gracefully in UI

## Migration Checklist

When adding new relationships:

- [ ] Add foreign key constraint in schema with appropriate cascade rule
- [ ] Add index on foreign key for query performance
- [ ] Add validation function in `relational-integrity.ts`
- [ ] Use validation in all relevant endpoints
- [ ] Document in this file
- [ ] Create database migration
- [ ] Test orphaned record scenarios
- [ ] Test cascade delete behavior
