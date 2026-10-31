"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { motionEase, openingMotion } from "@/domain/motion";

export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const step = openingMotion(Boolean(reduce));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || "instant" in step) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ y: step.y, opacity: step.opacity }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: step.duration, delay, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}
