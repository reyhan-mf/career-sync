"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Illustration Side */}
      <div className="hidden md:flex flex-col flex-1 bg-surface-container-low relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary-container/20" />
          {/* Decorative floating shapes */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-tertiary-fixed/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary-fixed/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <div className="inline-flex items-center justify-center p-6 bg-surface-container-lowest rounded-full mb-4 shadow-ambient">
            <Icon
              name="account_balance"
              filled
              className="text-primary text-6xl"
              size={56}
            />
          </div>
          <h1 className="font-headline text-4xl lg:text-5xl font-bold text-on-background leading-tight">
            Bridge the Gap Between <span className="text-primary">Campus</span>{" "}
            and <span className="text-primary">Career</span>
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Join CareerSync to seamlessly transition from academic excellence to
            professional success. Connect, learn, and grow within a curated
            network.
          </p>
        </div>
      </div>

      {/* Right: Login Form Side */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest relative z-10 w-full md:max-w-md lg:max-w-xl">
        {/* Header */}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 pb-12 w-full max-w-lg mx-auto">
          <div className="space-y-2 mb-8">
            <h2 className="font-headline text-3xl font-bold text-on-background">
              Welcome Back
            </h2>
            <p className="font-body text-on-surface-variant">
              Access your academic and professional portal.
            </p>
          </div>

          <div className="space-y-8">
            {/* Campus SSO Section (Mahasiswa & Admin) */}
            <div>
              <p className="font-label text-sm text-on-surface-variant mb-3 font-semibold uppercase tracking-wider">
                Mahasiswa & Administrator
              </p>
              <Link
                href="/sso"
                className="w-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label font-bold rounded-lg py-4 flex justify-center items-center gap-3 transition-colors shadow-ambient"
              >
                <Icon name="account_circle" size={24} />
                Login with Campus SSO
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center text-sm font-label">
                <span className="bg-surface-container-lowest px-4 text-on-surface-variant">
                  Or login as Recruiter
                </span>
              </div>
            </div>

            {/* HR / Recruiter Login Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Email */}
              <div className="space-y-2">
                <label
                  className="block font-label text-sm text-on-background"
                  htmlFor="email"
                >
                  Work Email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body placeholder:text-outline"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="block font-label text-sm text-on-background"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    className="font-label text-sm text-primary hover:text-primary-container transition-colors"
                    href="#"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                  <input
                    className="w-full bg-surface border border-outline-variant text-on-background rounded-lg pl-12 pr-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body placeholder:text-outline"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-background transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? "visibility" : "visibility_off"}
                    />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label font-bold rounded-lg py-3.5 mt-2 flex justify-center items-center gap-2 transition-colors border border-outline-variant"
                type="submit"
              >
                Sign In as HR
                <Icon name="login" size={20} />
              </button>
            </form>

            <div className="text-center font-body text-sm text-on-surface-variant">
              Looking for talent?{" "}
              <Link
                className="text-primary font-semibold hover:underline"
                href="/register"
              >
                Register your company
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center font-body text-sm text-on-surface-variant">
            <p>
              By signing in, you agree to our{" "}
              <Link className="text-primary hover:underline" href="#">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="text-primary hover:underline" href="#">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
