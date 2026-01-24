# Project Memory & Session History

## Session Summary (January 24, 2026)

### 1. User Management Fixes
- **Issue**: Server-side exception when creating a new user (Application error: a client-side exception has occurred).
- **Fix**: Wrapped `createOrgUser` in `lib/org-actions.ts` with a `try/catch` block to handle unique constraint violations (duplicate emails) gracefully. It now returns a structured `{ success, error }` object instead of throwing.

### 2. Dashboard Metrics & UI Consistency
- **Total Tasks**: 
    - Renamed from "Total Cases".
    - Logic updated to exclude items of type 'DOCUMENT'.
    - Now matches the default "All Tasks" view.
- **Total Varieties**: 
    - Renamed from "Active Cases" to clearer "Total Varieties".
- **Pending Documents Widget**:
    - **Issue**: Clicking "Cases need required documents" redirected to a generic "Pending Tasks" list which often appeared empty or irrelevant.
    - **Fix**: Created a specific `filter=documents` view in `TasksPage`. The widget now links to `/dashboard/tasks?filter=documents`.
- **Upcoming Deadlines**:
    - **Logic Update**: Changed from "Future dates only" to "Everything Pending (Tasks + Docs + Certs) due <= 90 days from now". This explicitly *includes* overdue items.
    - **UI Update**: Renamed title to "Upcoming Deadlines (90 days)".
    - **Consistency**: clicking the widget now leads to the `upcoming` filter which mirrors this exact logic (Status=PENDING AND DueDate <= Today+90).

### 3. Navigation & Workflow Improvements
- **Task List behavior**:
    - **Issue**: Clicking "View" on a task redirected to the parent Application page, confusing users who wanted details on the specific task.
    - **Fix**: Updated the "View" button in `app/dashboard/tasks/page.tsx` to link to `/dashboard/tasks/[id]` (Task Details page).

## Technical Implementation Details

### File Changes
- `lib/org-actions.ts`: Added error handling.
- `app/dashboard/page.tsx`: 
    - Adjusted SQL queries to match new logic.
    - Updated UI labels ("Total Tasks", "Total Varieties").
    - Updated links for "Pending Documents".
- `app/dashboard/tasks/page.tsx`:
    - Added `documents` filter case.
    - Adjusted `upcoming` filter to remove `gte(now)` constraint (allowing overdue).
    - Changed table row action link to task details.

### SQL Logic Reference
- **Upcoming Filter**: `AND(status = 'PENDING', dueDate <= NOW() + 90 days)`
- **Total Tasks**: `type != 'DOCUMENT'`
