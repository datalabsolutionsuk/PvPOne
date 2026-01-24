"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrgUser, updateOrgUser, deleteOrgUser } from "@/lib/org-actions";
import { Pencil, Trash2, Plus, X } from "lucide-react";

import { HighlightedText } from "@/components/ui/highlighted-text";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function OrgUserManagement({
  users,
  currentUserRole,
  query,
}: {
  users: User[];
  currentUserRole: string;
  query?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setIsLoading(true);
    await deleteOrgUser(id);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (editingUser) {
        formData.append("id", editingUser.id);
        await updateOrgUser(formData);
      } else {
        await createOrgUser(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save user:", error);
      alert(error instanceof Error ? error.message : "Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <HighlightedText text={user.name || "N/A"} query={query} />
                </TableCell>
                <TableCell>
                  <HighlightedText text={user.email} query={query} />
                </TableCell>
                <TableCell>
                  <HighlightedText text={user.role} query={query} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingUser?.name || ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email || ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  name="role" 
                  defaultValue={editingUser?.role || (currentUserRole === "LawyerAdmin" ? "LawyerAdmin" : "ClientUser")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentUserRole === "LawyerAdmin" || currentUserRole === "SuperAdmin") && (
                      <SelectItem value="LawyerAdmin">Associate (Lawyer Admin)</SelectItem>
                    )}
                    {(currentUserRole === "ClientAdmin" || currentUserRole === "SuperAdmin") && (
                      <SelectItem value="ClientUser">Client User</SelectItem>
                    )}
                    {currentUserRole === "SuperAdmin" && (
                      <SelectItem value="ClientAdmin">Client Admin</SelectItem>
                    )}
                    <SelectItem value="ReadOnly">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password {editingUser && "(Leave blank to keep current)"}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required={!editingUser}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
