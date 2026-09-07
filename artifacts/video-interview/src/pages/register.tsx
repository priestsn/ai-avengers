import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle2, X, Zap, Upload } from "lucide-react";
import { useCandidateAuth } from "@/hooks/use-candidate-auth";
import { Button, Input, Label } from "@/components/ui-elements";
import { useI18n } from "@/i18n";
import LanguageSelector from "@/components/LanguageSelector";

export default function Register() {
  const [, setLocation] = useLocation();
  const { saveToken } = useCandidateAuth();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState("");
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleCvUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setCvError(t.registerPage.cvOnlyPdf);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCvError(t.registerPage.cvTooLarge);
      return;
    }
    setCvUploading(true);
    setCvError("");
    setCvFile(file);
    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch(`${import.meta.env.BASE_URL}api/cv-upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setCvText(data.text || "");
    } catch {
      setCvError(t.registerPage.cvUploadError);
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t.registerPage.passwordMismatch);
      return;
    }
    if (password.length < 6) {
      setError(t.registerPage.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/candidate-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
          cvText: cvText || undefined,
          cvFileName: cvFile?.name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.registerPage.registrationError);
        return;
      }

      saveToken(data.token);
      setLocation("/my-applications");
    } catch {
      setError(t.registerPage.connectionError);
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
          className="w-full max-w-lg"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.common.backToHome}
          </Link>

          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 text-accent mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t.registerPage.title}</h1>
            <p className="text-muted-foreground">{t.registerPage.subtitle}</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.registerPage.fullNameLabel}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input required value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder={t.registerPage.fullNamePlaceholder} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.registerPage.phoneLabel}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder={t.registerPage.phonePlaceholder} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.registerPage.emailLabel}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder={t.registerPage.emailPlaceholder} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.registerPage.passwordLabel}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder={t.registerPage.passwordPlaceholder} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.registerPage.confirmPasswordLabel}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" placeholder={t.registerPage.confirmPasswordPlaceholder} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.registerPage.cvLabel} <span className="text-muted-foreground font-normal text-xs ml-1">{t.registerPage.cvOptional}</span></Label>
                <div
                  onClick={() => cvInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") void handleCvUpload(f); }}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all text-center"
                >
                  {cvUploading ? (
                    <span className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t.registerPage.cvProcessing}</span>
                  ) : cvFile ? (
                    <span className="text-sm text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {cvFile.name}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCvFile(null); setCvText(""); setCvError(""); }} className="ml-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                    </span>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t.registerPage.cvDragDrop}</span>
                    </>
                  )}
                  <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleCvUpload(f); }} />
                </div>
                {cvError && <p className="text-sm text-destructive">{cvError}</p>}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">{error}</div>
              )}

              <Button type="submit" className="w-full text-lg mt-2" size="lg" disabled={loading}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t.registerPage.registering}</> : t.registerPage.createAccount}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t.registerPage.hasAccount}{" "}
              <Link href="/login-candidato" className="text-primary hover:underline font-medium">{t.common.login}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
