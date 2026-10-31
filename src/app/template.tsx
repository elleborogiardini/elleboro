"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motionEase, screenMotion } from "@/domain/motion";

export default function Template({ children }: { children: ReactNode }) {
  const path = usePathname();
  const reduced = useReducedMotion();
  const step = screenMotion(path, Boolean(reduced));
  if ("instant" in step) return <>{children}</>;
  const initial =
    "x" in step ? { x: step.x, opacity: step.opacity } : "y" in step ? { y: step.y, opacity: step.opacity } : { opacity: step.opacity };
  const animate = "x" in step || "y" in step ? { x: 0, y: 0, opacity: 1 } : { opacity: 1 };
  return (
    <motion.div initial={initial} animate={animate} transition={{ duration: step.duration, ease: motionEase }}>
      {children}
    </motion.div>
  );
}
