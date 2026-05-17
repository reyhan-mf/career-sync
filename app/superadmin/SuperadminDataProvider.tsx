"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialAdminAccounts as seedAdmins,
  prodiIntegrationStatus as seedProdis,
  type AdminAccount,
  type ProdiStatus,
} from "@/lib/admin-mock";

interface SuperadminDataContextValue {
  admins: AdminAccount[];
  setAdmins: (next: AdminAccount[]) => void;
  prodis: ProdiStatus[];
  addProdi: (name: string) => ProdiStatus | null;
}

const SuperadminDataContext = createContext<SuperadminDataContextValue | null>(null);

export function SuperadminDataProvider({ children }: { children: ReactNode }) {
  const [admins, setAdmins] = useState<AdminAccount[]>(() => [...seedAdmins]);
  const [prodis, setProdis] = useState<ProdiStatus[]>(() => [...seedProdis]);

  const addProdi = useCallback(
    (name: string): ProdiStatus | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      let result: ProdiStatus | null = null;
      setProdis((current) => {
        const exists = current.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          result = null;
          return current;
        }
        const entry: ProdiStatus = {
          name: trimmed,
          status: "planned",
          note: "Baru ditambahkan oleh superadmin",
        };
        result = entry;
        return [...current, entry];
      });
      return result;
    },
    [],
  );

  const value = useMemo(
    () => ({ admins, setAdmins, prodis, addProdi }),
    [admins, prodis, addProdi],
  );

  return (
    <SuperadminDataContext.Provider value={value}>
      {children}
    </SuperadminDataContext.Provider>
  );
}

export function useSuperadminData() {
  const ctx = useContext(SuperadminDataContext);
  if (!ctx) {
    throw new Error(
      "useSuperadminData must be used within SuperadminDataProvider",
    );
  }
  return ctx;
}
