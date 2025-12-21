
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, dispatch] = useFormState(resetPassword, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
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
    </div>
  );
}
