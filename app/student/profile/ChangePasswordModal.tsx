"use client";

import Icon from "@/components/ui/Icon";
import React, { useEffect, useMemo, useState } from "react";

interface Requirement {
  label: string;
  check: boolean;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="font-label text-sm font-medium text-on-background block"
      >
        {label}
      </label>
      <div className="flex items-center bg-surface-container-low rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-shadow">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 min-w-0 bg-transparent rounded-l-lg pl-4 pr-2 py-2.5 focus:outline-none font-body text-sm text-on-background placeholder:text-outline"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="shrink-0 flex items-center justify-center w-10 h-10 mr-1 rounded-md text-on-surface-variant hover:text-on-background transition-colors"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          tabIndex={-1}
        >
          <Icon name={show ? "visibility_off" : "visibility"} size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setError(null);
    setSuccess(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const requirements = useMemo<Requirement[]>(
    () => [
      { label: "Minimal 8 karakter", check: newPw.length >= 8 },
      {
        label: "Huruf besar dan kecil",
        check: /[a-z]/.test(newPw) && /[A-Z]/.test(newPw),
      },
      { label: "Mengandung angka", check: /\d/.test(newPw) },
      {
        label: "Berbeda dari password lama",
        check: newPw.length > 0 && newPw !== oldPw,
      },
    ],
    [newPw, oldPw],
  );

  const allValid = requirements.every((r) => r.check);
  const confirmTouched = confirmPw.length > 0;
  const passwordsMatch = confirmTouched && newPw === confirmPw;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw) {
      setError("Password lama wajib diisi.");
      return;
    }
    if (!allValid) {
      setError("Password baru belum memenuhi semua syarat.");
      return;
    }
    if (!passwordsMatch) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setError(null);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="check_circle" className="text-green-700" size={32} />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-background">
              Password Berhasil Diubah
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-1.5">
              Gunakan password baru Anda saat login berikutnya.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-on-background">
                  Ganti Password
                </h2>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Gunakan password yang unik dan tidak Anda pakai di layanan
                  lain.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-2 -mr-2 -mt-1 hover:bg-surface-container rounded-lg transition-colors"
                aria-label="Tutup"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <PasswordField
                id="old-password"
                label="Password Lama"
                value={oldPw}
                onChange={setOldPw}
                show={showOld}
                onToggleShow={() => setShowOld((s) => !s)}
                placeholder="Password saat ini"
                autoComplete="current-password"
              />

              <div>
                <PasswordField
                  id="new-password"
                  label="Password Baru"
                  value={newPw}
                  onChange={setNewPw}
                  show={showNew}
                  onToggleShow={() => setShowNew((s) => !s)}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />
                {newPw.length > 0 && (
                  <ul className="mt-2.5 space-y-1 pl-0.5">
                    {requirements.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-center gap-1.5 font-label text-xs"
                      >
                        <Icon
                          name={
                            r.check ? "check_circle" : "radio_button_unchecked"
                          }
                          size={14}
                          className={
                            r.check ? "text-green-700" : "text-outline"
                          }
                        />
                        <span
                          className={
                            r.check
                              ? "text-on-surface-variant"
                              : "text-outline"
                          }
                        >
                          {r.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <PasswordField
                  id="confirm-password"
                  label="Konfirmasi Password Baru"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((s) => !s)}
                  placeholder="Ketik ulang password baru"
                  autoComplete="new-password"
                />
                {confirmTouched && !passwordsMatch && (
                  <p className="font-label text-xs text-error mt-1.5 flex items-center gap-1">
                    <Icon name="error" size={13} />
                    Password tidak cocok.
                  </p>
                )}
                {passwordsMatch && (
                  <p className="font-label text-xs text-green-700 mt-1.5 flex items-center gap-1">
                    <Icon name="check_circle" size={13} />
                    Password cocok.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-error-container/40 border border-error/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
                  <Icon name="error" className="text-error mt-0.5" size={16} />
                  <p className="font-body text-xs text-on-error-container">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center py-2.5 rounded-lg border border-outline/30 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!oldPw || !allValid || !passwordsMatch}
                  className="flex-1 btn-gradient font-label text-sm font-bold rounded-lg py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ubah Password
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
