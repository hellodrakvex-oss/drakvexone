export const easings = {
  default: [0.25, 0.1, 0.25, 1] as const,
  apple: [0.32, 0.72, 0, 1] as const,
  dramatic: [0.22, 1, 0.36, 1] as const,
  subtle: [0.4, 0, 0.2, 1] as const,
};

export const durations = {
  page: 0.20,
  item: 0.15,
  stagger: 0.04,
  modal: 0.15,
  splash: 0.8,
  empty: 0.35,
};

export const springs = {
  press: { type: "spring" as const, stiffness: 400, damping: 25 },
  navPill: { type: "spring" as const, stiffness: 380, damping: 32 },
};

export const variants = {
  page: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: durations.page,
        ease: easings.default,
        staggerChildren: durations.stagger,
      },
    },
  },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.item, ease: easings.default },
    },
  },
  empty: {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: durations.empty, ease: easings.default },
    },
  },
};
