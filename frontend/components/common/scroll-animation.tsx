"use client"

import { useEffect, useRef } from "react"

interface ScrollAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollAnimation({ children, className = "", delay = 0 }: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = ref.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (currentRef) {
        const rect = currentRef.getBoundingClientRect()
        const isInView = rect.top < window.innerHeight * 0.8 && rect.bottom > 0
        
        if (isInView) {
          // Element is already in view, animate immediately
          setTimeout(() => {
            currentRef.classList.add("visible")
          }, 50)
        } else {
          observer.observe(currentRef)
        }
      }
    })

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const delayClass = delay > 0 ? `scroll-section-delay-${Math.min(Math.floor(delay * 10), 3)}` : ""

  return (
    <div 
      ref={ref} 
      className={`scroll-section ${delayClass} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}

