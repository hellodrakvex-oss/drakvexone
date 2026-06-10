import * as React from "react"
import { cn } from "@/lib/utils"

interface DrakvexLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  variant?: "standard" | "mono" | "glow"
  showText?: boolean
}

export function DrakvexLogo({
  size = 32,
  variant = "standard",
  showText = false,
  className,
  ...props
}: DrakvexLogoProps) {
  const isGlow = variant === "glow"
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "shrink-0",
          isGlow && "drop-shadow-[0_0_12px_rgba(14,165,255,0.5)]"
        )}
        {...props}
      >
        {/* Gradients */}
        <defs>
          <linearGradient id="drakvex-blue-violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5FF" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="drakvex-violet-blue" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#0EA5FF" />
          </linearGradient>
        </defs>

        {/* Outer Hexagon/Shield Shape */}
        <path
          d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
          fill="url(#drakvex-blue-violet)"
          fillOpacity={variant === "mono" ? "0.2" : "0.1"}
          stroke={variant === "mono" ? "currentColor" : "url(#drakvex-blue-violet)"}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        
        {/* Inner Abstract 'D' / Wing motif */}
        <path
          d="M35 30V70L65 50L35 30Z"
          fill={variant === "mono" ? "currentColor" : "url(#drakvex-violet-blue)"}
          className="drop-shadow-lg"
        />
        
        {/* Accent Cut */}
        <path
          d="M55 40L65 50L55 60"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-bold tracking-tight text-xl text-gradient">
          Drakvex
        </span>
      )}
    </div>
  )
}
