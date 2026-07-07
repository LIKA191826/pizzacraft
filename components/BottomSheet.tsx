"use client";

import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { animate, motion, useDragControls, useMotionValue } from "framer-motion";

/** Height of the sheet that stays visible when collapsed. */
const PEEK_HEIGHT = 168;

/** useLayoutEffect on the client (measure before paint), silent no-op in SSR. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Best-guess collapsed offset before we can measure — avoids a first-paint flash. */
function guessCollapsedY(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerHeight * 0.58 - PEEK_HEIGHT);
}

/**
 * Mobile-only bottom drawer for the ingredient tray. Rests just above the
 * checkout bar and snaps between two points: peek and expanded.
 *
 * Position is driven by a motion value we set/animate directly (not the
 * `animate` prop) so the drag gesture and the programmatic snaps never
 * fight — the bug that used to leave it stuck open, covering the pizza.
 * A ResizeObserver re-measures once the `dvh` height resolves.
 */
export default function BottomSheet({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedY, setCollapsedY] = useState(0);
  const collapsedYRef = useRef(0);
  const expandedRef = useRef(false);
  const draggedRef = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const y = useMotionValue(guessCollapsedY());

  useIsomorphicLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      const c = Math.max(0, el.offsetHeight - PEEK_HEIGHT);
      collapsedYRef.current = c;
      setCollapsedY(c);
      // Keep the sheet pinned to its current snap point as the size resolves.
      if (!expandedRef.current) y.set(c);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [y]);

  const snap = (exp: boolean) => {
    expandedRef.current = exp;
    setExpanded(exp);
    animate(y, exp ? 0 : collapsedYRef.current, {
      type: "spring",
      stiffness: 380,
      damping: 36,
    });
  };

  return (
    <motion.div
      ref={sheetRef}
      className="fixed inset-x-0 bottom-[76px] z-30 h-[58dvh] rounded-t-[28px] bg-parchment shadow-sheet md:hidden"
      style={{ y }}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: collapsedY }}
      dragElastic={0.05}
      onDragStart={() => {
        draggedRef.current = false;
      }}
      onDrag={(_e, info) => {
        if (Math.abs(info.offset.y) > 6) draggedRef.current = true;
      }}
      onDragEnd={(_e, info) => {
        if (!draggedRef.current) return; // a tap — let onClick handle it
        if (Math.abs(info.velocity.y) > 300) snap(info.velocity.y < 0);
        else snap(y.get() < collapsedYRef.current / 2);
      }}
    >
      {/* Grab handle — drag to slide, or tap to toggle. 44px tap target. */}
      <button
        aria-label={expanded ? "Collapse ingredients" : "Expand ingredients"}
        className="flex min-h-11 w-full touch-none items-center justify-center"
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false; // that was a drag, not a tap
            return;
          }
          snap(!expandedRef.current);
        }}
      >
        <span className="h-1.5 w-12 rounded-full bg-ink/15" />
      </button>

      <div className="h-full px-4 pb-16">{children}</div>
    </motion.div>
  );
}
