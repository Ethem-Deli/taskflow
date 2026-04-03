# Database Query Testing Guide

## Overview

The `prisma/test-queries.ts` script provides comprehensive testing of your database queries with real data. It tests:

- ✅ Query correctness and data retrieval
- ✅ Filter and sort operations
- ✅ Relationship integrity
- ✅ Query performance (execution time)
- ✅ Index effectiveness
- ✅ Complex queries with multiple conditions

## Running Tests

### Quick Start

```bash
# Run all database query tests
npm run db:test-queries
```

### What Happens

1. **Setup Phase**: Creates realistic test data
   - 3 users (Alice, Bob, Charlie)
   - 2 projects (Web App Redesign, Mobile App)
   - Project memberships with roles
   - 4 tasks with various statuses and priorities
   - 3 comments on tasks

2. **Test Phase**: Runs 15 comprehensive tests
3. **Report Phase**: Shows results with timing and statistics

## Test Coverage

### 1. Project Access Tests
- **Get all projects for a user** - Uses projectMember lookup
- **Get project members** - Retrieves all members with details
- **Get project owner** - Verifies owner relationship
- **Project statistics** - Counts tasks by status

### 2. Task Query Tests  
- **Get tasks in project** - Basic task retrieval
- **Filter by status** - IN_PROGRESS, TODO, DONE
- **Filter by priority** - HIGH, MEDIUM, LOW
- **Filter by assignee** - Tasks assigned to user
- **Get unassigned tasks** - Tasks with null assignee
- **Search by text** - Title and description search
- **Filter by due date** - Upcoming tasks
- **Complex filters** - Multiple conditions combined

### 3. Comment Tests
- **Get comments on task** - With user details, sorted by date
- **Count comments** - Comments per task aggregation

### 4. Relational Integrity Tests
- **Validate task belongs to project** - Scoping verification
- **Validate assignee is project member** - Relationship check

## Expected Output

```
🧪 Starting Database Query Tests with Real Data

📝 Setting up test data...
✓ Test data created

🧪 Running query tests...

✓ Get all projects for user (1.2ms)
  → Found 2 projects
✓ Get all tasks in project (with status filter) (0.8ms)
  → Found 1 IN_PROGRESS tasks
✓ Get all HIGH priority tasks in project (0.5ms)
  → Found 2 HIGH priority tasks
... (more tests)

============================================================
📊 TEST RESULTS
============================================================

✓ Passed: 15/15
✗ Failed: 0/15
⏱  Total time: 45ms

============================================================
```

## Interpreting Results

### Timing
- **< 5ms**: Excellent - Index working effectively
- **5-20ms**: Good - Query is optimized
- **> 20ms**: Check if indexes exist or query can be optimized

### Common Issues

**Test Fails**: Check the error message in parentheses
```
✗ Get all projects for user (2.1ms)
  Expected to find projects for user
```

**Slow Query**: If timing is high, check:
1. Are indexes created? (`prisma/schema.prisma`)
2. Is the query using indexed columns?
3. Does the test data represent realistic scale?

## Modifying Tests

### Add a New Test

```typescript
await runTest("Your test name", async () => {
  const result = await db.yourModel.findMany({
    where: { /* conditions */ },
  });

  if (result.length === 0) {
    throw new Error("Expected to find results");
  }
  console.log(`  → Found ${result.length} records`);
});
```

### Test Real-World Scenarios

Common scenarios to test:

```typescript
// Scenario 1: User gets their dashboard data
const userProjects = await db.projectMember.findMany({
  where: { userId: userId },
  include: { project: { include: { tasks: true } } }
});

// Scenario 2: Project owner gets statistics
const projectStats = await db.project.findUnique({
  where: { id: projectId },
  include: {
    tasks: {
      include: { _count: { select: { comments: true } } }
    }
  }
});

// Scenario 3: Filter dashboard tasks
const myTasks = await db.task.findMany({
  where: {
    assigneeId: userId,
    status: "IN_PROGRESS"
  },
  include: { project: true, assignee: true }
});
```

## Database Indexes Performance

The test script validates that your indexes are working. Expected metrics:

### With Proper Indexes
- Single entity lookup: < 1ms
- Filter by indexed column: < 2ms
- Composite filter: < 3ms
- Join with include: < 5ms

### Indicates Missing Indexes
- Task-to-Project lookup: > 5ms
- Filter tasks by status: > 10ms
- Comment queries: > 5ms

## Cleaning Up Test Data

The test script creates data but doesn't clean it up (to allow inspection). To reset:

```bash
# Reset database
npx prisma migrate reset

# Rerun tests
npm run db:test-queries
```

⚠️ **Warning**: `migrate reset` deletes all data in the development database. Use with caution.

## Best Practices

1. **Run regularly**: After adding indexes, use this to verify they work
2. **Test with realistic data**: The script creates typical usage patterns
3. **Monitor timing**: Watch for regressions as data grows
4. **Verify relationships**: Ensures relational integrity is maintained
5. **Document slow queries**: If a query is slow, add a note about why

## Advanced: Load Testing

To test with larger datasets, modify the test data creation:

```typescript
// Create 100 tasks instead of 4
for (let i = 0; i < 100; i++) {
  await db.task.create({
    data: { /* ... */ }
  });
}
```

Then run tests and watch for performance degradation.

## Troubleshooting

### "No such table" error
- Run migrations: `npx prisma migrate dev`
- Check database URL in `.env`

### Timeout errors
- Database is slow or not responding
- Check database connection
- Try increasing timeout in test script

### Tests passing but app slow
- Test data might be too small
- Analyze real usage patterns
- Consider additional indexes

## Related Commands

```bash
# View database schema
npx prisma studio

# Run migrations
npx prisma migrate dev

# Create backup before testing
npx prisma db push

# View query logs
QUERY_ENGINE_LOG=info npm run db:test-queries
```
