
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePassword } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

function ResetPasswordForm() {
  const [state, dispatch] = useFormState(updatePassword, undefined);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="text-center text-red-500">
        Missing token!
      </div>
    );
  }

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="password">New Password</Label>
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
          <ResetButton />
          <div className="text-center text-sm">
            <Link href="/login" className="underline">
              Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
