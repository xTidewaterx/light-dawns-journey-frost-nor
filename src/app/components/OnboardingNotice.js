"use client";

import { useEffect, useState } from "react";

export default function OnboardingNotice({
  storageKey,
  title,
  children,
  buttonLabel = "Skjonn, takk",
  className = "",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setVisible(true);
      return;
    }

    try {
      const seen = localStorage.getItem(storageKey);
      setVisible(!seen);
    } catch (err) {
      setVisible(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch (err) {
        // Ignore storage errors and still close the notice in-memory.
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-800 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
          <div className="mt-1 text-sm leading-relaxed">{children}</div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 rounded-lg border border-sky-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-sky-100"
        >
          x
        </button>
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
