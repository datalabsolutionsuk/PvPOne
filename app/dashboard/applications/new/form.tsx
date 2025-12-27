"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApplication } from "@/lib/actions";

interface Variety {
  id: string;
  name: string;
  species: string;
}

interface Jurisdiction {
  id: string;
  name: string;
  code: string;
}

interface NewApplicationFormProps {
  varieties: Variety[];
  jurisdictions: Jurisdiction[];
}

export function NewApplicationForm({ varieties, jurisdictions }: NewApplicationFormProps) {
  const [isNewVariety, setIsNewVariety] = useState(false);

  return (
    <form action={createApplication} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="varietyId">Variety</Label>
          <Button 
            type="button" 
            variant="link" 
            className="h-auto p-0 text-xs"
            onClick={() => setIsNewVariety(!isNewVariety)}
          >
            {isNewVariety ? "Select Existing Variety" : "Create New Variety"}
          </Button>
        </div>
        
        {isNewVariety ? (
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="newVarietyName">Variety Name</Label>
              <Input name="newVarietyName" placeholder="e.g. Red Delicious" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newVarietySpecies">Species</Label>
              <Input name="newVarietySpecies" placeholder="e.g. Malus domestica" required />
            </div>
            <input type="hidden" name="isNewVariety" value="true" />
          </div>
        ) : (
          <Select name="varietyId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a variety" />
            </SelectTrigger>
            <SelectContent>
              {varieties.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} ({v.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jurisdictionId">Jurisdiction</Label>
        <Select name="jurisdictionId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            {jurisdictions.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.name} ({j.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="applicationNumber">Application Number</Label>
        <Input name="applicationNumber" placeholder="e.g. 12345" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="filingDate">Filing Date</Label>
        <Input type="date" name="filingDate" required />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create Application
        </Button>
      </div>
    </form>
  );
}
