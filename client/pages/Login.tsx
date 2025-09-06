import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Chrome } from "lucide-react";
import { useAppState } from "@/context/app-state";

export default function Login() {
  const { setCurrentUser } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("role");
      return (r === "doctor" ? "doctor" : "user") as "user" | "doctor";
    } catch {
      return "user" as const;
    }
  }, []);

  const mode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("mode") === "signup" ? "signup" : "login";
    } catch {
      return "login" as const;
    }
  }, []);

  const [name, setName] = useState("");

  function handleLogin() {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setCurrentUser({ id: `u_${Date.now()}`, name: role === "doctor" ? `Dr. ${email.split("@")[0] || "Member"}` : (email.split("@")[0] || "Member"), email, role, dosha: role === "user" ? "Kapha" : null });
    window.location.assign("/dashboard");
  }

  const bgUrl = "https://images.pexels.com/photos/3621234/pexels-photo-3621234.jpeg";

  return (
    <div
      className="min-h-screen w-full bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.45)_28%,rgba(0,0,0,0.2)_52%,transparent_82%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <Card className="rounded-2xl border bg-white shadow-sm">
            <CardContent className="p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-slate-900" />
                <h1 className="text-2xl font-semibold tracking-tight">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? `Sign up as ${role}` : `Log in to your ${role} account`}</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 focus-visible:ring-2" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 focus-visible:ring-2" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <a className="text-muted-foreground underline-offset-4 hover:underline" href="#">Forgot password?</a>
                </div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button className="h-10 w-full rounded-full" onClick={mode === "signup" ? () => {
                    if (!email || !password) { setError("Please enter your email and password"); return; }
                    setCurrentUser({ id: `u_${Date.now()}`, name: name || (role === "doctor" ? `Dr. ${email.split("@")[0] || "Member"}` : (email.split("@")[0] || "Member")), email, role, dosha: role === "user" ? "Kapha" : null });
                    window.location.assign("/dashboard");
                  } : handleLogin}>{mode === "signup" ? "Create account" : "Log in"}</Button>
                </motion.div>

                <div className="my-2 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="h-10 w-full rounded-full">
                  <Chrome className="mr-2 h-4 w-4" /> Continue with Google
                </Button>
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>Already have an account? <a className="underline-offset-4 hover:underline" href={`/login?role=${role}`}>Log in</a></>
                ) : (
                  <>Don’t have an account? <a className="underline-offset-4 hover:underline" href={`/login?mode=signup&role=${role}`}>Sign up</a></>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
