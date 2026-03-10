import React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  // Lê o tema diretamente do DOM para evitar dependência de hook
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      richColors
      closeButton
      position="top-right"
      {...props}
    />
  )
}

export { Toaster }

