
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Key, Table as TableIcon, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from 'next/dynamic';

const MermaidDiagram = dynamic(() => import('@/components/mermaid-diagram'), { ssr: false });

interface RelationProps {
  type: "one-to-many" | "many-to-one" | "one-to-one";
  target: string;
  description: string;
}

const erDiagram = `
erDiagram
    ORGANISATIONS ||--|{ USERS : "has members"
    ORGANISATIONS ||--|{ VARIETIES : owns
    ORGANISATIONS ||--|{ APPLICATIONS : files
    
    VARIETIES ||--|{ VARIETY_BREEDERS : has
    VARIETIES ||--|{ APPLICATIONS : "subject of"
    
    JURISDICTIONS ||--|{ RULESETS : defines
    JURISDICTIONS ||--|{ APPLICATIONS : receives
    
    RULESETS ||--|{ RULE_DEADLINES : includes
    RULESETS ||--|{ RULE_FEES : includes
    
    APPLICATIONS ||--|{ DOCUMENTS : contains
    APPLICATIONS ||--|{ TASKS : generates
    APPLICATIONS ||--|{ QUERIES : "discussed in"
    
    USERS ||--|{ DOCUMENTS : uploads
`;

function Legend() {
  return (
    <Card className="bg-slate-50/50 border-dashed">
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          Notation Key
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pb-4">
        <div>
           <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">Listing Notation</h4>
           <div className="space-y-3">
              <div className="flex items-start gap-3">
                 <Badge variant="outline" className="w-16 justify-center bg-white">1 → N</Badge>
                 <div>
                    <span className="font-medium text-slate-700 block">One-to-Many</span>
                    <span className="text-muted-foreground text-xs leading-tight">One record in this table links to multiple records in the target table.</span>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <Badge variant="outline" className="w-16 justify-center bg-white">N ← 1</Badge>
                  <div>
                    <span className="font-medium text-slate-700 block">Many-to-One</span>
                    <span className="text-muted-foreground text-xs leading-tight">Multiple records in this table link to a single record in the target table.</span>
                 </div>
              </div>
           </div>
        </div>
        
        <div>
           <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">Visual Diagram Symbols</h4>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <div className="h-6 w-16 flex items-center justify-center bg-white border rounded text-xs font-mono">||--|&#123;</div>
                 <div>
                    <span className="font-medium text-slate-700 block">One-to-Many Connection</span>
                    <span className="text-muted-foreground text-xs">A solid line ending in a "crow's foot" means one entity relates to many others.</span>
                 </div>
              </div>
               <div className="flex items-center gap-3">
                 <div className="h-6 w-16 flex items-center justify-center bg-white border rounded text-xs font-mono">||--||</div>
                 <div>
                    <span className="font-medium text-slate-700 block">One-to-One Connection</span>
                    <span className="text-muted-foreground text-xs">Double vertical bars on both ends implies a unique, single connection.</span>
                 </div>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Relation({ type, target, description }: RelationProps) {
  return (
    <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 mb-1">
      <Badge variant="outline" className="w-24 justify-center shrink-0">
        {type === "one-to-many" ? "1 → N" : type === "many-to-one" ? "N ← 1" : "1 - 1"}
      </Badge>
      <div className="flex items-center gap-1 font-medium text-primary">
         <TableIcon className="h-3 w-3" />
         {target}
      </div>
      <span className="text-muted-foreground text-xs">- {description}</span>
    </div>
  );
}

function EntityCard({ name, description, children }: { name: string, description: string, children: React.ReactNode }) {
  return (
    <Card className="min-w-[300px]">
      <CardHeader className="pb-3 border-b bg-slate-50">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-base font-bold font-mono text-slate-800">{name}</CardTitle>
            </div>
            <Badge variant="secondary">Table</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}

export default async function RelationshipsPage() {
  const session = await auth();
  if (session?.user?.email !== "foxh1@hotmail.com") {
    redirect("/dashboard");
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">System Entity Relationships</h1>
            <p className="text-muted-foreground">Visualization of the PvP One data model and dependencies.</p>
        </div>
      </div>

      <div className="space-y-8">
        
        <Legend />

        {/* ER Diagram Section */}
        <section>
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                Entity Relationship Diagram
            </h2>
            <MermaidDiagram chart={erDiagram} />
        </section>
        
        {/* Module: Identity & Tenancy */}
        <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-500" />
                Identity & Tenancy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EntityCard name="organisations" description="Root tenant entity. All major resources belong to an organisation.">
                    <Relation type="one-to-many" target="users" description="Members of the org" />
                    <Relation type="one-to-many" target="varieties" description="Varieties owned by org" />
                    <Relation type="one-to-many" target="applications" description="Apps filed by org" />
                </EntityCard>
                <EntityCard name="users" description="System users (Staff, Clients, Admins).">
                    <Relation type="many-to-one" target="organisations" description="User belongs to Org" />
                    <Relation type="one-to-many" target="documents" description="uploaded_by" />
                </EntityCard>
            </div>
        </section>

        {/* Module: Core Domain */}
        <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-green-500" />
                Core PVP Domain
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EntityCard name="varieties" description="Plant varieties being protected.">
                    <Relation type="many-to-one" target="organisations" description="Owner" />
                    <Relation type="one-to-many" target="variety_breeders" description="Multiple breeders per variety" />
                    <Relation type="one-to-many" target="applications" description="Applications for this variety" />
                </EntityCard>

                <EntityCard name="variety_breeders" description="Join table for breeders.">
                    <Relation type="many-to-one" target="varieties" description="Links to parent Variety" />
                </EntityCard>

                <EntityCard name="applications" description="The central case file. Connects a Variety to a Jurisdiction.">
                    <Relation type="many-to-one" target="organisations" description="Owner" />
                    <Relation type="many-to-one" target="varieties" description="Subject Matter" />
                    <Relation type="many-to-one" target="jurisdictions" description="Target Country/Region" />
                    <Relation type="one-to-many" target="documents" description="Attachments" />
                    <Relation type="one-to-many" target="tasks" description="Workflow items" />
                    <Relation type="one-to-many" target="queries" description="Communication threads" />
                </EntityCard>
            </div>
        </section>

         {/* Module: Rules Engine */}
         <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Rules Engine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EntityCard name="jurisdictions" description="Countries or Regions (e.g. EG, EU).">
                    <Relation type="one-to-many" target="rulesets" description="Versioned logic" />
                    <Relation type="one-to-many" target="applications" description="Apps filed here" />
                </EntityCard>
                
                <EntityCard name="rulesets" description="Versioned configuration for a jurisdiction.">
                    <Relation type="many-to-one" target="jurisdictions" description="Parent Jurisdiction" />
                    <Relation type="one-to-many" target="rule_deadlines" description="Automatic deadlines" />
                    <Relation type="one-to-many" target="rule_fees" description="Cost structure" />
                    <Relation type="one-to-many" target="rule_requirements" description="Required docs" />
                </EntityCard>
            </div>
        </section>

        {/* Module: Operations */}
         <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-500" />
                Workflow & Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EntityCard name="documents" description="Files stored in system (as DataURI).">
                    <Relation type="many-to-one" target="applications" description="Related Application" />
                    <Relation type="many-to-one" target="tasks" description="Related Task (optional)" />
                    <Relation type="many-to-one" target="users" description="Uploader" />
                </EntityCard>

                <EntityCard name="tasks" description="Action items or Deadlines.">
                     <Relation type="many-to-one" target="applications" description="Parent Application" />
                     <Relation type="many-to-one" target="documents" description="Attachments" />
                </EntityCard>

                 <EntityCard name="queries" description="Support or Helper threads.">
                     <Relation type="many-to-one" target="applications" description="Context" />
                     <Relation type="one-to-many" target="messages" description="Thread content" />
                </EntityCard>
            </div>
        </section>
      </div>
    </div>
  );
}
