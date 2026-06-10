"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps["theme"]>("dark")

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark")
          setTheme(isDark ? "dark" : "light")
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/60 group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_4px_40px_rgba(0,0,0,0.8)] group-[.toaster]:backdrop-blur-xl drakvex-cut",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium rounded-lg",
          success: 
            "group-[.toaster]:bg-emerald-500/10 group-[.toaster]:text-emerald-400 group-[.toaster]:border-emerald-500/20 group-[.toaster]:shadow-[0_0_30px_rgb(16_185_129/0.15)]",
          error: 
            "group-[.toaster]:bg-rose-500/10 group-[.toaster]:text-rose-400 group-[.toaster]:border-rose-500/20 group-[.toaster]:shadow-[0_0_30px_rgb(244_63_94/0.15)]",
          warning: 
            "group-[.toaster]:bg-orange-500/10 group-[.toaster]:text-orange-400 group-[.toaster]:border-orange-500/20 group-[.toaster]:shadow-[0_0_30px_rgb(249_115_22/0.15)]",
          info: 
            "group-[.toaster]:bg-blue-500/10 group-[.toaster]:text-blue-400 group-[.toaster]:border-blue-500/20 group-[.toaster]:shadow-[0_0_30px_rgb(59_130_246/0.15)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
