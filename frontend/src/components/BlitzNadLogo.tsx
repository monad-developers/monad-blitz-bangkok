import React from 'react'
import Image from 'next/image'

interface BlitzNadLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BlitzNadLogo({ className = '', size = 'md' }: BlitzNadLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto', 
    lg: 'h-16 w-auto'
  }

return (
    <div className={`flex items-center ${className}`}>
        <Image
            src="/BlitzNad.png"
            alt="BlitzNad"
            width={600}
            height={200}
            className={`${sizeClasses[size]} object-contain`}
            priority
        />
    </div>
)
}