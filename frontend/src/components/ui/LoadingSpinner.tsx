export default function LoadingSpinner({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-6 h-6 border-2' : size === 'lg' ? 'w-16 h-16 border-4' : 'w-10 h-10 border-4'
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${s} border-garden-200 border-t-garden-600 rounded-full animate-spin`} />
    </div>
  )
}
