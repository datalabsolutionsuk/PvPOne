import { auth, signOut } from "@/lib/auth";
import { getCurrentOrganisationId } from "@/lib/context";
import { db } from "@/lib/db";
import { organisations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exitOrganisationView } from "@/lib/actions";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const currentOrgId = await getCurrentOrganisationId();
  
  let viewingOrgName = null;
  if (session?.user?.role === "SuperAdmin" && currentOrgId && currentOrgId !== session.user.organisationId) {
    const [org] = await db.select().from(organisations).where(eq(organisations.id, currentOrgId));
    viewingOrgName = org?.name;
  }

  async function handleSignOut() {
    "use server";
    await signOut();
  }

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      <Sidebar 
        email={session?.user?.email}
        viewingOrgName={viewingOrgName}
        role={session?.user?.role}
        onExitOrgView={exitOrganisationView}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-hidden w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}
