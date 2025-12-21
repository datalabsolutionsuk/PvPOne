"use client";

import { useFormState, useFormStatus } from "react-dom";
import { register } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function RegisterButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, dispatch] = useFormState(register, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account for your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                placeholder="John Doe" 
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="orgName">Organisation Name</Label>
              <Input 
                id="orgName" 
                name="orgName"
                placeholder="Acme Corp" 
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="name@example.com" 
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
              />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="text-sm text-green-500">
                {state.success}
              </div>
            )}
            {state?.debugLink && (
              <div className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800">
                <p className="font-bold">Development Mode:</p>
                <p>Email delivery might fail without domain verification.</p>
                <Link href={state.debugLink} className="underline font-bold text-blue-600">
                  Click here to verify immediately
                </Link>
              </div>
            )}
            <RegisterButton />
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
