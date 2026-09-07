import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Building2, UserCircle2, ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { useLoginHR } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Label } from "@/components/ui-elements";
import { useI18n } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import { PatchNotesButton } from "@/components/PatchNotesModal";

export default function Home() {
  const [, setLocation] = useLocation();
  const { saveToken } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useLoginHR({
    mutation: {
      onSuccess: (data) => {
        saveToken(data.token);
        setLocation("/dashboard");
      },
      onError: () => {
        setError(t.home.invalidCredentials);
      }
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden bg-background">

      <div className="relative z-20 flex items-center justify-center gap-3 py-5 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="text-2xl font-display font-extrabold tracking-tight text-foreground">
          AI <span className="text-primary">Avengers</span>
        </span>
        <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ml-1">
          {t.common.recruitingPlatform}
        </span>
        <div className="ml-auto absolute right-4 flex items-center gap-2">
          <PatchNotesButton />
          <LanguageSelector />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">

        <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 border-b md:border-b-0 md:border-r border-white/10">
          <div className="absolute inset-0 z-0">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-hr.png`}
              alt="HR Background"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <Building2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
                {t.home.hrPortal}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t.home.hrSubtitle}
              </p>
            </div>

            <div className="glass-panel p-8 rounded-3xl">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label>{t.common.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder={t.home.emailPlaceholder}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.common.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder={t.common.password}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full text-lg mt-2"
                  size="lg"
                  isLoading={loginMutation.isPending}
                >
                  {t.home.loginToDashboard}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
          <div className="absolute inset-0 z-0">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-candidate.png`}
              alt="Candidate Background"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 w-full max-w-md text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/20 text-accent mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <UserCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-4">
              {t.home.joinTeam}
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              {t.home.joinSubtitle}
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <Link
                href="/positions"
                className="inline-flex items-center justify-center h-14 px-8 rounded-xl font-semibold text-lg bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-[0.98]"
              >
                {t.home.viewOpenPositions} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <div className="flex gap-3">
                <Link
                  href="/login-candidato"
                  className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl font-medium text-sm bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 transition-all"
                >
                  {t.home.login}
                </Link>
                <Link
                  href="/register"
                  className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl font-medium text-sm bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 transition-all"
                >
                  {t.home.register}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
