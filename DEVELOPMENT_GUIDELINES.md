# Development Guidelines & Architecture Decisions

## 1. Dashboard Metrics Consistency
*   **Rule:** Every metric card on the dashboard must strictly match the data displayed on the page it links to.
*   **Implementation:**
    *   If a card says "Total Tasks" and links to `/dashboard/tasks`, the count query for the card must use the exact same WHERE clauses (filters) as the default view of `/dashboard/tasks`.
    *   *Example:* If `/dashboard/tasks` hides `DOCUMENT` type tasks, the "Total Tasks" card must also exclude `DOCUMENT` type tasks.

## 2. Tasks vs. Documents Separation
*   **Database:** Both Tasks and Documents (sometimes) share the `tasks` table infrastructure or are closely related.
*   **UI Separation:**
    *   **Tasks Page:** Displays general work items (Deadlines, Reminders). **MUST EXCLUDE** `type = 'DOCUMENT'`.
    *   **Documents Page:** Displays file requests and uploads. **MUST INCLUDE** `type = 'DOCUMENT'` logic (often via `pending_documents` views).
    *   **Logic:** `tasks.type = 'DOCUMENT'` items are "Missing Documents" until uploaded, then they become records in the `documents` table.

## 3. Navigation & "Back" Buttons
*   **Context Preservation:** When navigating from a global Admin list (e.g., "All Varieties") to a detail view, we needs to preserve the context to ensure the "Back" button works correctly.
*   **Implementation:** Use the `?from=` URL search parameter.
    *   `?from=admin_varieties` -> Back to `/dashboard/admin/varieties`
    *   `?from=admin_applications` -> Back to `/dashboard/admin/applications`
    *   `?from=admin_maintenance` -> Back to `/dashboard/admin/maintenance`

## 4. User Management (Admin)
*   **Forms:** All user creation/editing forms must:
    *   Use Server Actions that return `{ success: boolean, error?: string }` objects.
    *   Never throw unhandled errors in Server Actions (causes full page crash).
    *   Strictly validate `role` enums against `db/schema.ts` before insertion.
    *   Handle duplicate email errors gracefully and show a user-friendly alert.

## 5. File Uploads
*   **Storage:** Files are currently stored as Base64 Data URIs in the Postgres database (`storagePath` column).
*   **Limits:** Max file size is set to **4.5MB** to prevent payload issues.
*   **Allowed Types:** PDF, Word, Excel, JPG, PNG, WEBP.
