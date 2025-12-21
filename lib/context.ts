import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getCurrentOrganisationId() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.role === "SuperAdmin") {
    const cookieStore = cookies();
    const impersonatedOrgId = cookieStore.get("admin_org_context")?.value;
    if (impersonatedOrgId) {
      return impersonatedOrgId;
    }
  }

  return session.user.organisationId;
}

export async function isSuperAdmin() {
  const session = await auth();
  return session?.user?.role === "SuperAdmin";
}
