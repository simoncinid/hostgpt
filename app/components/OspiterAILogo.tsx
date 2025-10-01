import Image from 'next/image'
import { cn } from '../../lib/utils'

interface OspiterAILogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  textClassName?: string
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
}

export default function OspiterAILogo({ 
  size = 'md', 
  className = '', 
  showText = false,
  textClassName = ''
}: OspiterAILogoProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Image
        src="/icons/logoospiterai.png"
        alt="OspiterAI Logo"
        width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
        className={cn(sizeClasses[size], 'object-contain')}
        priority
      />
      {showText && (
        <span className={cn('font-bold text-gray-900', textClassName)}>
          OspiterAI
        </span>
      )}
    </div>
  )
}
