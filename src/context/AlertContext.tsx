"use client";

// week-6-sprint-4 : Global alert context to display success and error messages across the application

import { createContext, useContext, useState, ReactNode } from "react";
import Alert from "@/components/Alert";

type AlertType = "success" | "error";

type AlertContextType = {
  showAlert: (type: AlertType, message: string) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });

    // auto-hide after 3 seconds
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {/* week-6-sprint-4 : global alert display */}
      {alert && (
        <div className="fixed top-5 right-5 z-50 w-80">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider");
  }

  return context;
}