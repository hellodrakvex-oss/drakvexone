"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  formatter = (val) => val.toLocaleString(),
  className,
}: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 15,
    mass: 1,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => formatter(Math.round(current)));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (!mounted) {
    return <span className={className}>{formatter(0)}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
