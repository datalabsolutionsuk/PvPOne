
I'm addressing the user's feedback that "creating a new DUS creates a new application" is confusing/wrong.

Plan:
1.  Check `app/dashboard/applications/page.tsx`.
    *   Currently, the "New Application" button links to `/dashboard/applications/new`.
    *   This is the same button even when filtered by `status=DUS`.
2.  If the user is on the DUS page (`status=DUS`), the "Create" button should probably do something more specific to DUS.
3.  The user says "DUS is a sub of Varieties".
    *   This implies they might want to select a Variety first, then "Create DUS" for it.
4.  Strategy:
    *   If `searchParams.status === 'DUS'`, change the button label to "New DUS".
    *   Link it to a new page `app/dashboard/applications/new-dus` (or pass a param to existing new page).
    *   In the "New DUS" form:
        *   Ask for Variety (Select existing).
        *   Ask for Jurisdiction.
        *   Ask for DUS Status (Waiting/Approved).
        *   Ask for Expected Date.
        *   *Auto-fill* the Application Status to "DUS" (instead of "Filed").
    *   This effectively creates an Application record but *framed* as creating a DUS record.

Let's modify `app/dashboard/applications/page.tsx` to handle the button label and link conditionally.
Then modify `app/dashboard/applications/new/page.tsx` or create a new one to handle the "DUS" context.
Actually, reusing the `new` page with a query param `?type=DUS` is probably cleanest.

Update plan:
1.  Modify `app/dashboard/applications/page.tsx`:
    *   Read `searchParams.status`.
    *   If `status === 'DUS'`, label button "New DUS" and link to `/dashboard/applications/new?type=DUS`.
2.  Modify `app/dashboard/applications/new/page.tsx`:
    *   Pass the `searchParams` to the form.
3.  Modify `app/dashboard/applications/new/form.tsx`:
    *   Accept `type` prop.
    *   If `type === 'DUS'`:
        *   Hide "Filing Date" (or make it optional/secondary?). DUS usually happens after filing, but maybe they are entering historic data? I'll keep it but maybe default status to "DUS".
        *   Add fields for `dusStatus` and `dusExpectedDate` directly in the creation form.
        *   Hide "Application Number" logic if it's auto-generated, or maybe they need to inputs it? The current create action generates it.
    *   Update `createApplication` action to accept `dusStatus` and `dusExpectedDate` and `status` override.

Wait, `createApplication` currently forces `status: "Filed"`.
I need to update `createApplication` to accept an optional `initialStatus` and the DUS fields.
