# User Roles & Permissions

This table outlines the capabilities of each user role in the PvP One system.

| Feature / Action | SuperAdmin | LawyerAdmin | ClientAdmin | ClientUser | ReadOnly |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Administration** | | | | | |
| Manage All Organisations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Organisation Management** | | | | | |
| Manage Own Org Users | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Billing/Subscription | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Org Settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Application Management** | | | | | |
| Create/Edit Applications | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Applications | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change App Status | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Data & Documents** | | | | | |
| Create/Edit Varieties | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Documents | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | | | | | |
| Create/Assign Tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Complete Tasks | ✅ | ✅ | ✅ | ✅ | ❌ |

## Role Definitions

- **SuperAdmin**: Full system access. Can manage all tenants (organisations), billing, and global settings.
- **LawyerAdmin**: Administrative access for legal professionals managing the IP portfolios. Can manage workflows and status changes that Clients cannot.
- **ClientAdmin**: Administrator for a specific client organisation. Can manage their own users and view billing, but cannot change legal statuses.
- **ClientUser**: Standard user for a client. Can create applications and upload data but has no administrative privileges.
- **ReadOnly**: Can view data and download documents but cannot make any changes.
