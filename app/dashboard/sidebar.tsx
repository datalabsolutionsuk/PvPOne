"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  email?: string | null;
  viewingOrgName?: string | null;
  role?: string;
  onExitOrgView: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ 
  email, 
  viewingOrgName, 
  role, 
  onExitOrgView, 
  onSignOut 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link 
      href={href} 
      className="block py-2 px-4 rounded hover:bg-gray-800"
      onClick={() => setIsOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 text-white flex-shrink-0">
        <span className="font-bold text-xl">PVP One</span>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white hover:bg-gray-800">
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside className={cn(
        "bg-gray-900 text-white flex-col transition-all duration-300 ease-in-out z-50",
        "md:w-64 md:flex md:static", // Desktop: fixed width, always flex, static position
        isOpen ? "fixed inset-0 w-full" : "hidden" // Mobile: fixed overlay when open, hidden otherwise
      )}>
        <div className="p-6 flex flex-col h-full overflow-y-auto">
          <div className="mb-8 flex justify-between items-start">
            <div className="w-full">
              <h1 className="text-2xl font-bold hidden md:block mb-1">PVP One</h1>
              <div className="flex justify-between items-center md:block">
                 <p className="text-sm text-gray-400 truncate">{email}</p>
                 <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setIsOpen(false)}>
                    <X />
                 </Button>
              </div>
              
              {viewingOrgName && (
                <div className="mt-4 p-2 bg-blue-900 rounded text-xs border border-blue-700">
                  <p className="font-semibold text-blue-200">Viewing as:</p>
                  <p className="truncate mb-2">{viewingOrgName}</p>
                  <form action={onExitOrgView}>
                    <Button variant="secondary" size="sm" className="w-full h-6 text-xs">
                      Exit View
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/applications">Applications</NavLink>
            <NavLink href="/dashboard/varieties">Varieties</NavLink>
            <div className="pl-4 space-y-1">
               <NavLink href="/dashboard/applications?status=DUS">DUS</NavLink>
               <NavLink href="/dashboard/applications?status=Certificate_Issued">PBR Certificates</NavLink>
            </div>
            <NavLink href="/dashboard/tasks">Tasks</NavLink>
            <NavLink href="/dashboard/jurisdictions">Jurisdictions</NavLink>
            <NavLink href="/dashboard/documents">Documents</NavLink>
            <NavLink href="/dashboard/subscription">Subscription</NavLink>
            
            {(role === "LawyerAdmin" || role === "ClientAdmin") && (
              <NavLink href="/dashboard/users">Users</NavLink>
            )}
            
            {role === "SuperAdmin" && (
              <>
                <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </div>
                <NavLink href="/dashboard/admin/organisations">Organisations</NavLink>
                <NavLink href="/dashboard/admin/users">Users</NavLink>
                <NavLink href="/dashboard/tasks">All Tasks</NavLink>
                <NavLink href="/dashboard/documents">All Documents</NavLink>
                <NavLink href="/dashboard/admin/subscriptions">Subscriptions</NavLink>
                <NavLink href="/dashboard/admin/settings">Settings</NavLink>
              </>
            )}
          </nav>

          <div className="mt-auto pt-8">
            <form action={onSignOut}>
              <Button variant="destructive" className="w-full">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
