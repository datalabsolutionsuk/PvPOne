import { updateRuleset, createRuleDocumentRequirement } from "@/lib/actions";
import { db } from "@/lib/db";
import { rulesets, ruleDocumentRequirements, ruleDeadlines, ruleTerms, ruleFees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, FileText, Clock, Calendar, Plus, Coins } from "lucide-react";
import { DocumentRow } from "./document-row";

export default async function EditRulesetPage({ params }: { params: { id: string } }) {
  const [ruleset] = await db
    .select()
    .from(rulesets)
    .where(eq(rulesets.id, params.id));

  if (!ruleset) {
    notFound();
  }

  const documents = await db
    .select()
    .from(ruleDocumentRequirements)
    .where(eq(ruleDocumentRequirements.rulesetId, ruleset.id));

  const deadlines = await db
    .select()
    .from(ruleDeadlines)
    .where(eq(ruleDeadlines.rulesetId, ruleset.id));

  const terms = await db
    .select()
    .from(ruleTerms)
    .where(eq(ruleTerms.rulesetId, ruleset.id));

  const fees = await db
    .select()
    .from(ruleFees)
    .where(eq(ruleFees.rulesetId, ruleset.id));

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/jurisdictions/${ruleset.jurisdictionId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Rule Set</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Rule Set Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateRuleset} className="space-y-4">
              <input type="hidden" name="id" value={ruleset.id} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Set Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    required 
                    defaultValue={ruleset.name} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input 
                    id="version" 
                    name="version" 
                    required 
                    defaultValue={ruleset.version} 
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={ruleset.isActive} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Document Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
              {documents.length === 0 && <p className="text-sm text-muted-foreground">No document rules defined.</p>}
              
              <div className="pt-4 border-t mt-4">
                <h4 className="text-sm font-medium mb-3">Add New Requirement</h4>
                <form action={createRuleDocumentRequirement} className="flex items-end gap-3">
                  <input type="hidden" name="rulesetId" value={ruleset.id} />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="docType" className="text-xs">Document Type</Label>
                    <Input id="docType" name="docType" placeholder="e.g. DUS Report" required className="h-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
                    <Input id="notes" name="notes" placeholder="e.g. Original copy" className="h-8" />
                  </div>
                  <div className="flex items-center h-8 pb-1">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="requiredBool" 
                        name="requiredBool" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="requiredBool" className="text-xs">Required</Label>
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {deadlines.map((rule) => (
                <div key={rule.id} className="border-b pb-2 last:border-0">
                  <div className="font-medium">{(rule.appliesWhenJson as any)?.description || "Deadline"}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Trigger: {rule.triggerEvent} + {rule.offsetDays} days
                  </div>
                </div>
              ))}
              {deadlines.length === 0 && <p className="text-sm text-muted-foreground">No deadline rules defined.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Protection Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {terms.map((term) => (
                <div key={term.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <span className="font-medium">{term.varietyType}</span>
                  <span className="font-bold">{term.termYears} years</span>
                </div>
              ))}
              {terms.length === 0 && <p className="text-sm text-muted-foreground">No term rules defined.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Fees (Hidden Field Revealed) */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Official Fees</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {fees.map((fee) => (
                <div key={fee.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{fee.feeType}</div>
                    {fee.notes && <div className="text-xs text-muted-foreground">{fee.notes}</div>}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {fee.amount} {fee.currencyCode}
                  </div>
                </div>
              ))}
              {fees.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No fee rules defined.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
