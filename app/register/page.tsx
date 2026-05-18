"use client";

import Icon from "@/components/ui/Icon";
import { signIn } from "@/lib/supabase/auth";
import { registerHr } from "@/lib/supabase/hr-register";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  password: string;
  companyName: string;
  industry: string;
  website: string;
}

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  jobTitle: "",
  password: "",
  companyName: "",
  industry: "",
  website: "",
};

// Accept either bare domain (tokopedia.com) or full URL. Returns normalized
// https URL, or null if input is empty / clearly invalid.
function normalizeWebsite(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const website = form.website.trim() ? normalizeWebsite(form.website) : null;
    if (form.website.trim() && !website) {
      setError("Format website tidak valid. Contoh: tokopedia.com");
      return;
    }

    setIsLoading(true);
    try {
      await registerHr({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        jobTitle: form.jobTitle.trim(),
        companyName: form.companyName.trim(),
        industry: form.industry || null,
        website,
      });
      // Sign in so AuthGate sees a session.
      await signIn(form.email.trim(), form.password);
      router.replace("/hr/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Illustration Side */}
      <div className="hidden md:flex flex-col flex-1 bg-surface-container-low relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary-container/20" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-tertiary-fixed/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center justify-center p-6 bg-surface-container-lowest rounded-full mb-4 shadow-ambient">
            <Icon
              name="domain"
              filled
              className="text-primary text-6xl"
              size={56}
            />
          </div>
          <h1 className="font-headline text-4xl lg:text-5xl font-bold text-on-background leading-tight">
            Find the Perfect <span className="text-primary">Talent</span> for
            Your Company
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Create an HR account to start discovering verified students directly
            matches your specific skill requirements based on their academic
            outcomes.
          </p>
        </div>
      </div>

      {/* Right: Register Form Side */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest relative z-10 w-full md:max-w-md lg:max-w-xl">
        <header className="w-full px-8 py-6 flex items-center gap-3">
          <Icon
            name="school"
            filled
            className="text-primary text-3xl"
            size={28}
          />
          <span className="font-headline text-2xl font-bold text-primary tracking-tight">
            CareerSync
          </span>
        </header>

        <main className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 pb-12 w-full max-w-lg mx-auto">
          <div className="space-y-2 mb-8">
            <h2 className="font-headline text-3xl font-bold text-on-background">
              Company Registration
            </h2>
            <p className="font-body text-on-surface-variant">
              {step === 1
                ? "Step 1: HR Representative Profile"
                : "Step 2: Company Verification Details"}
            </p>

            {/* Progress Bar */}
            <div className="flex gap-2 pt-4">
              <div
                className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-surface-container-high"}`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-surface-container-high"}`}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-error-container rounded-xl text-error font-label text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-5 flex flex-col gap-1" onSubmit={handleNext}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-label text-sm text-on-background" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="given-name"
                    required
                    autoComplete="given-name"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="John"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-sm text-on-background" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="family-name"
                    required
                    autoComplete="family-name"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="Doe"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="email">
                  Work Email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="name@company.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="jobTitle">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  name="job-title"
                  required
                  autoComplete="organization-title"
                  className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                  placeholder="e.g. Technical Recruiter"
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => update("jobTitle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    id="password"
                    name="new-password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-background"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? "visibility" : "visibility_off"}
                    />
                  </button>
                </div>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label font-bold rounded-lg py-3.5 mt-4 transition-colors shadow-ambient"
                type="submit"
              >
                Continue to Company Details
              </button>
            </form>
          ) : (
            <form
              className="space-y-5 flex flex-col gap-1"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="companyName">
                  Company Name
                </label>
                <div className="relative">
                  <Icon
                    name="business"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    id="companyName"
                    name="company-name"
                    required
                    autoComplete="organization"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="PT. Inovasi Teknologi"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="industry">
                  Industry Area
                </label>
                <div className="relative">
                  <select
                    id="industry"
                    required
                    autoComplete="off"
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    className="w-full appearance-none bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                  >
                    <option value="" disabled>
                      Select an industry...
                    </option>
                    <option value="tech">Technology & Software</option>
                    <option value="finance">Finance & Banking</option>
                    <option value="education">Education</option>
                    <option value="health">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                  <Icon
                    name="arrow_drop_down"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background" htmlFor="website">
                  Company Website
                </label>
                <div className="relative">
                  <Icon
                    name="language"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    id="website"
                    name="company-website"
                    autoComplete="url"
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="tokopedia.com"
                    type="text"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                  />
                </div>
                <p className="font-label text-[11px] text-on-surface-variant leading-snug">
                  Boleh tanpa http:// — contoh: tokopedia.com
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label font-bold rounded-lg py-3.5 px-6 transition-colors border border-outline-variant"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  className="flex-1 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label font-bold rounded-lg py-3.5 transition-colors shadow-ambient flex items-center justify-center gap-2 disabled:opacity-70"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icon name="progress_activity" className="animate-spin" />{" "}
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center font-body text-sm text-on-surface-variant">
            Already registered?{" "}
            <Link
              className="text-primary font-semibold hover:underline"
              href="/login"
            >
              Sign in here
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
