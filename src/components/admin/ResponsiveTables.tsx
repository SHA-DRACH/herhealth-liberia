"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Gives every cell in admin tables a data-label taken from its column heading, so the CSS in
 * globals.css can show each row as a labelled card on phones instead of a cut-off wide table.
 */
export function ResponsiveTables() {
  const path = usePathname();
  useEffect(() => {
    const root = document.getElementById("admin-main");
    if (!root) return;
    const label = () => {
      root.querySelectorAll("table").forEach((table) => {
        const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
        table.querySelectorAll("tbody tr").forEach((tr) => {
          [...tr.children].forEach((cell, i) => {
            // Full-width cells (e.g. "No articles yet.") are messages, not values, so they get no label.
            const spans = (cell as HTMLTableCellElement).colSpan > 1;
            if (heads[i] && !spans && !cell.hasAttribute("data-label")) cell.setAttribute("data-label", heads[i]);
          });
        });
        table.classList.add("stack-on-mobile");
      });
    };
    label();
    const obs = new MutationObserver(label);
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [path]);
  return null;
}
