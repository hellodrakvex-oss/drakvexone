import * as React from "react";
import { cn } from "@/lib/utils";

export function SalesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-full h-full", className)}>
      <rect x="25" y="45" width="20" height="40" rx="4" fill="currentColor" fillOpacity="0.2" />
      <rect x="55" y="25" width="20" height="60" rx="4" fill="currentColor" fillOpacity="0.8" />
      <path d="M15 65L35 45L65 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="65" cy="25" r="6" fill="currentColor" />
    </svg>
  );
}

export function ExpensesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-full h-full", className)}>
      <rect x="25" y="25" width="50" height="50" rx="8" fill="currentColor" fillOpacity="0.2" />
      <path d="M35 50H65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M45 40L35 50L45 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DuesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-full h-full", className)}>
      <circle cx="50" cy="40" r="15" fill="currentColor" fillOpacity="0.2" />
      <path d="M25 80C25 65 35 55 50 55C65 55 75 65 75 80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="70" cy="30" r="8" fill="currentColor" />
    </svg>
  );
}

export function DashboardIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-full h-full", className)}>
      <rect x="20" y="20" width="25" height="25" rx="6" fill="currentColor" fillOpacity="0.8" />
      <rect x="55" y="20" width="25" height="25" rx="6" fill="currentColor" fillOpacity="0.2" />
      <rect x="20" y="55" width="25" height="25" rx="6" fill="currentColor" fillOpacity="0.2" />
      <rect x="55" y="55" width="25" height="25" rx="6" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}
