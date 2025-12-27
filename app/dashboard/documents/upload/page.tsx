import { uploadDocument } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function UploadDocumentPage({
  searchParams,
}: {
  searchParams: { taskId?: string; type?: string; applicationId?: string };
}) {
  const backLink = searchParams.taskId 
    ? `/dashboard/tasks/${searchParams.taskId}` 
    : searchParams.applicationId 
      ? `/dashboard/applications/${searchParams.applicationId}`
      : "/dashboard/documents";

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="flex items-center gap-4">
        <Link href={backLink}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Upload Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadDocument} className="space-y-4">
            {searchParams.taskId && (
              <input type="hidden" name="taskId" value={searchParams.taskId} />
            )}
            {searchParams.applicationId && (
              <input type="hidden" name="applicationId" value={searchParams.applicationId} />
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Document Name</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. Signed POA" 
                defaultValue={searchParams.type || ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select name="type" required defaultValue={searchParams.type ? "Other" : undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POA">Power of Attorney</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Priority Document">Priority Document</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input 
                id="owner" 
                name="owner" 
                placeholder="e.g. John Doe" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input 
                id="file" 
                name="file" 
                type="file" 
                required 
                accept=".doc,.docx,.pdf,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, Word, Excel, Images (JPG, PNG)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Upload
              </Button>
              <Link href="/dashboard/documents" className="flex-1">
                <Button variant="outline" type="button" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
