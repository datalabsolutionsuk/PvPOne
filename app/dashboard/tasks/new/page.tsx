import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/lib/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NewTaskPage({
  searchParams,
}: {
  searchParams: { applicationId: string; type: string };
}) {
  if (!searchParams.applicationId || !searchParams.type) {
    redirect("/dashboard/applications");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add {searchParams.type === "DEADLINE" ? "Deadline" : "Document Requirement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTask} className="space-y-4">
            <input type="hidden" name="applicationId" value={searchParams.applicationId} />
            <input type="hidden" name="type" value={searchParams.type} />
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Submit Power of Attorney" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional details..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button asChild variant="outline">
                <Link href={`/dashboard/applications/${searchParams.applicationId}`}>Cancel</Link>
              </Button>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
