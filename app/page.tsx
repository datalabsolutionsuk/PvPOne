import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { 
  ShieldCheck, 
  Globe, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Menu,
  X
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">PvP One</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-green-600 transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-green-600 transition-colors">Solutions</Link>
            <Link href="#pricing" className="hover:text-green-600 transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-slate-900 hover:bg-slate-800">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">
                  Log in
                </Link>
                <Link href="/login">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-slate-50">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2"></span>
                The New Standard for Plant Variety Protection
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
                Protect Your <span className="text-green-600">Green Innovation</span> Globally
              </h1>
              
              <p className="text-xl text-slate-600 max-w-[42rem]">
                The all-in-one operating system for breeders and IP lawyers. Manage varieties, track deadlines, and streamline applications across every jurisdiction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 h-12 px-8 text-base">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                    View Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Abstract Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 opacity-10">
             <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-green-400 blur-3xl"></div>
             <div className="absolute top-[20%] -left-[20%] w-[600px] h-[600px] rounded-full bg-blue-400 blur-3xl"></div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to manage PVP
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Stop managing million-dollar IP portfolios in spreadsheets.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-start p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Global Jurisdictions</h3>
                <p className="text-slate-600">
                  Built-in rulesets for EU, US, and other major regions. We handle the complexity of local regulations so you don't have to.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Deadlines</h3>
                <p className="text-slate-600">
                  Never miss a renewal or submission window. Our engine automatically calculates deadlines based on filing dates and local rules.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Document Vault</h3>
                <p className="text-slate-600">
                  Securely store deeds, technical questionnaires, and assignment proofs linked directly to your variety applications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-6">
                  Trusted by leading breeders and IP firms
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <p className="text-slate-300">Centralized dashboard for all your varieties</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <p className="text-slate-300">Automated DUS examination tracking</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <p className="text-slate-300">Bank-grade security for your intellectual property</p>
                  </div>
                </div>
                <div className="mt-8">
                  <Link href="/login">
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                      Get Started Now
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl bg-slate-800 border border-slate-700 p-8 overflow-hidden">
                {/* Abstract UI Mockup */}
                <div className="absolute top-8 left-8 right-8 bottom-0 bg-white rounded-t-xl shadow-2xl p-6">
                   <div className="flex items-center gap-4 mb-6 border-b pb-4">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                   </div>
                   <div className="space-y-4">
                      <div className="h-8 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-32 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                        Dashboard Preview
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         <div className="h-20 bg-green-50 rounded"></div>
                         <div className="h-20 bg-blue-50 rounded"></div>
                         <div className="h-20 bg-amber-50 rounded"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Choose the plan that fits your portfolio size.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter Plan */}
              <div className="flex flex-col p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                  <p className="text-slate-500 text-sm">For small breeders</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Up to 5 varieties</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Basic deadline tracking</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>1 User seat</span>
                  </li>
                </ul>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </div>

              {/* Professional Plan */}
              <div className="flex flex-col p-8 bg-white rounded-2xl border-2 border-green-600 shadow-lg relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Professional</h3>
                  <p className="text-slate-500 text-sm">For growing firms</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$49</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Up to 50 varieties</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Advanced deadline engine</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>5 User seats</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Document Vault</span>
                  </li>
                </ul>
                <Link href="/login">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Start Free Trial</Button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="flex flex-col p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                  <p className="text-slate-500 text-sm">For large organizations</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">Custom</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Unlimited varieties</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>API Access</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>SSO & Advanced Security</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Dedicated Support</span>
                  </li>
                </ul>
                <Link href="mailto:sales@pvpone.com">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-green-600 rounded flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">PvP One</span>
              </div>
              <p className="text-sm text-slate-500">
                The operating system for plant variety protection.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">Features</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Pricing</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">About</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Contact</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Legal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-slate-900">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-slate-900">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-slate-500">
            © 2025 PvP One. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
