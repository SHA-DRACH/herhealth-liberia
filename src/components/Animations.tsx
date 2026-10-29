"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/**
 * AOS (Animate On Scroll) for the elements matching `selector`. Attributes are added from
 * JavaScript only, so content is never hidden if scripts fail to load. Animations are short,
 * run once, and are switched off for people who ask their device for reduced motion.
 */
export function Animations({ selector, animation = "fade-up" }: { selector: string; animation?: string }) {
  const path = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const tag = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el, i) => {
        if (el.hasAttribute("data-aos")) return;
        el.setAttribute("data-aos", animation);
        el.setAttribute("data-aos-delay", String(Math.min(i, 6) * 40));
      });
    };
    tag();
    AOS.init({ duration: 450, easing: "ease-out-cubic", once: true, offset: 24 });
    AOS.refreshHard();
    // Content that appears later (search results, answers) is animated too.
    let frame = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        tag();
        AOS.refresh();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, [path, selector, animation]);
  return null;
}
