"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [step, setStep] = useState(1);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi API Call
    setTimeout(() => {
      router.push("/hr/dashboard");
    }, 1500);
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

          {step === 1 ? (
            <form
              className="space-y-5 flex flex-col gap-1"
              onSubmit={handleNext}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-label text-sm text-on-background">
                    First Name
                  </label>
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="John"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label text-sm text-on-background">
                    Last Name
                  </label>
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="Doe"
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background">
                  Work Email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="name@company.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background">
                  Job Title
                </label>
                <input
                  required
                  className="w-full bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                  placeholder="e.g. Technical Recruiter"
                  type="text"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background">
                  Password
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
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
            >
              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background">
                  Company Name
                </label>
                <div className="relative">
                  <Icon
                    name="business"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="PT. Inovasi Teknologi"
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label text-sm text-on-background">
                  Industry Area
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none bg-surface border border-outline-variant text-on-background rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                  >
                    <option value="" disabled selected>
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
                <label className="block font-label text-sm text-on-background">
                  Company Website
                </label>
                <div className="relative">
                  <Icon
                    name="language"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    required
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
                    placeholder="https://www.company.com"
                    type="url"
                  />
                </div>
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
