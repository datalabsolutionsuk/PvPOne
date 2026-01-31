import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemSettings, saveSystemSettings } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "SuperAdmin") {
    redirect("/dashboard");
  }

  const settings = await getSystemSettings();

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSystemSettings} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                <Input 
                  id="stripePublicKey" 
                  name="stripePublicKey" 
                  defaultValue={settings["STRIPE_PUBLIC_KEY"] || ""} 
                  placeholder="pk_test_..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                <Input 
                  id="stripeSecretKey" 
                  name="stripeSecretKey" 
                  type="password"
                  defaultValue={settings["STRIPE_SECRET_KEY"] || ""} 
                  placeholder="sk_test_..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                <Input 
                  id="paypalClientId" 
                  name="paypalClientId" 
                  defaultValue={settings["PAYPAL_CLIENT_ID"] || ""} 
                  placeholder="Client ID" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalClientSecret">PayPal Client Secret</Label>
                <Input 
                  id="paypalClientSecret" 
                  name="paypalClientSecret" 
                  type="password"
                  defaultValue={settings["PAYPAL_CLIENT_SECRET"] || ""} 
                  placeholder="Client Secret" 
                />
              </div>
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSystemSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiModelName">Google Gemini Model Name</Label>
              <Input 
                id="aiModelName" 
                name="aiModelName" 
                defaultValue={settings["AI_MODEL_NAME"] || "gemini-1.5-flash"} 
                placeholder="e.g. gemini-1.5-flash or gemini-pro"
              />
              <p className="text-sm text-muted-foreground">
                Specify the Gemini model version to use for AI features. 
                Common values: <code>gemini-1.5-flash</code> (faster/cheaper), <code>gemini-pro</code> (legacy), <code>gemini-1.5-pro</code> (smarter).
              </p>
            </div>
            <Button type="submit">Save AI Settings</Button>
          </form>
        </CardContent>
      </Card>      </div>
    </div>
  );
}
