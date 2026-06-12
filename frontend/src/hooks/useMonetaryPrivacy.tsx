import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "marolo_hide_monetary_values";

interface MonetaryPrivacyContextValue {
  hidden: boolean;
  toggle: () => void;
}

const MonetaryPrivacyContext = createContext<MonetaryPrivacyContextValue | null>(null);

export function MonetaryPrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setHidden(raw === "true");
    } catch {
      setHidden(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      hidden,
      toggle: () => {
        setHidden((prev) => {
          const next = !prev;
          try {
            localStorage.setItem(STORAGE_KEY, String(next));
          } catch {
            // ignore storage access errors
          }
          return next;
        });
      },
    }),
    [hidden],
  );

  return <MonetaryPrivacyContext.Provider value={value}>{children}</MonetaryPrivacyContext.Provider>;
}

export function useMonetaryPrivacy() {
  const context = useContext(MonetaryPrivacyContext);
  if (!context) throw new Error("useMonetaryPrivacy must be used within MonetaryPrivacyProvider");
  return context;
}

