"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function SiteMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const motion = gsap.matchMedia();
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        const clean: Array<() => void> = [];

        gsap.utils.toArray<HTMLElement>("[data-portrait] img", root.current).forEach((photo) => {
          gsap.fromTo(
            photo,
            { scale: 0.92 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: photo,
                start: "top 90%",
                end: "top 35%",
                scrub: 0.6,
              },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-mark]", root.current).forEach((mark) => {
          gsap.fromTo(
            mark,
            { scale: 0.94, filter: "blur(8px)" },
            { scale: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out" },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-rise]", root.current).forEach((block) => {
          gsap.from(block, {
            y: 24,
            duration: 0.7,
            ease: "expo.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: block,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-work]", root.current).forEach((frame) => {
          const photo = frame.querySelector("img");
          if (!photo) return;
          const enter = () => gsap.to(photo, { scale: 1.04, duration: 0.7, ease: "power2.out" });
          const leave = () => gsap.to(photo, { scale: 1, duration: 0.7, ease: "power2.out" });
          frame.addEventListener("pointerenter", enter);
          frame.addEventListener("pointerleave", leave);
          clean.push(() => {
            frame.removeEventListener("pointerenter", enter);
            frame.removeEventListener("pointerleave", leave);
          });
        });

        return () => clean.forEach((stop) => stop());
      });
      return () => motion.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
