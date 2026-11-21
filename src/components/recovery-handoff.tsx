"use client";

import { useEffect } from "react";
import { recoveryHandoff } from "@/domain/recovery";

export function RecoveryHandoff() {
  useEffect(() => {
    const next = recoveryHandoff(window.location.pathname, window.location.hash);
    if (next) window.location.replace(next);
  }, []);
  return null;
}
