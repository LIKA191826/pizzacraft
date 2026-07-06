"use client";

import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useDragControls } from "framer-motion";

/** Height of the sheet that stays visible when collapsed. */
const PEEK_HEIGHT = 168;

/** useLayoutEffect on the client (measure before paint), silent no-op in SSR. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Mobile-only bottom drawer for the ingredient tray.
 * Swipes between two snap points (peek / expanded). Drag starts ONLY from
 * the grab handle via dragControls, so dragging an ingredient chip inside
 * the sheet never fights with dragging the sheet itself.
 */
export default function BottomSheet({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedY, setCollapsedY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Measure how far down the sheet sits when collapsed; re-measure on resize.
  // Layout effect: the first paint must already show the collapsed position.
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const h = sheetRef.current?.offsetHeight ?? 0;
      setCollapsedY(Math.max(0, h - PEEK_HEIGHT));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <motion.div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-40 h-[62dvh] rounded-t-[28px] bg-parchment pb-[env(safe-area-inset-bottom)] shadow-sheet md:hidden"
      initial={false}
      animate={{ y: expanded ? 0 : collapsedY }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: collapsedY }}
      dragElastic={0.05}
      onDragEnd={(_e, info) => {
        // Fling wins over position; otherwise snap to the nearer point.
        if (Math.abs(info.velocity.y) > 300) {
          setExpanded(info.velocity.y < 0);
        } else {
          setExpanded(info.offset.y < 0 ? true : info.offset.y > 0 ? false : expanded);
        }
      }}
    >
      {/* Grab handle — generous 44px tap target, also toggles on tap. */}
      <button
        aria-label={expanded ? "Collapse ingredients" : "Expand ingredients"}
        className="flex min-h-11 w-full touch-none items-center justify-center"
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="h-1.5 w-12 rounded-full bg-ink/15" />
      </button>

      <div className="h-full px-4 pb-16">{children}</div>
    </motion.div>
  );
}
