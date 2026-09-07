import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, ArrowLeft, Loader2, Zap } from "lucide-react";
import { useCandidateAuth } from "@/hooks/use-candidate-auth";
import { Button, Input, Label } from "@/components/ui-elements";
import { useI18n } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";

export default function LoginCandidato() {
  const [, setLocation] = useLocation();
  const { saveToken } = useCandidateAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/candidate-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.loginCandidate.invalidCredentials);
        return;
      }

      saveToken(data.token);
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("return");
      setLocation(returnUrl || "/my-applications");
    } catch {
      setError(t.loginCandidate.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <div className="flex items-center justify-center gap-3 py-5 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="text-2xl font-display font-extrabold tracking-tight text-foreground">
          AI <span className="text-primary">Avengers</span>
        </span>
        <LanguageSelector className="ml-auto absolute right-4" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.common.backToHome}
          </Link>

          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 text-accent mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <LogIn className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t.loginCandidate.title}</h1>
            <p className="text-muted-foreground">{t.loginCandidate.subtitle}</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label>{t.common.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder={t.loginCandidate.emailPlaceholder} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.common.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder={t.loginCandidate.passwordPlaceholder} />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">{error}</div>
              )}

              <Button type="submit" className="w-full text-lg mt-2" size="lg" disabled={loading}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t.loginCandidate.loggingIn}</> : t.common.login}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t.loginCandidate.noAccount}{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">{t.common.register}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
