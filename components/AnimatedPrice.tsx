"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { CURRENCY_SYMBOL } from "@/lib/ingredients";

/**
 * A price that never jumps — it ticks. The spring makes the total feel
 * like a physical counter reacting to what the user just did, which is
 * half of why dropping an ingredient feels consequential.
 */
export function AnimatedPrice({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 260, damping: 28 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(
    spring,
    (v) => `${Math.round(v)} ${CURRENCY_SYMBOL}`
  );

  return <motion.span className={className}>{display}</motion.span>;
}
