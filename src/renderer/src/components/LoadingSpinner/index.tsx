/**
 * 加载动画组件
 */
export function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        {/* 旋转加载器 */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent opacity-75" />
          <div className="absolute inset-2 h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>

        {/* 加载文字 */}
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">加载中</span>
          <span className="flex space-x-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>

        {/* 可选：添加进度提示 */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          正在准备内容...
        </p>
      </div>
    </div>
  );
}

/**
 * 小型加载器 - 用于内联加载状态
 */
export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div className={`rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]} animate-spin`} />
  );
}

/**
 * 骨架屏加载器 - 用于内容占位
 */
export function SkeletonLoader({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'text' | 'circle' | 'card';
}) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const variantClasses = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    circle: 'h-12 w-12 rounded-full',
    card: 'h-32 w-full',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

export default LoadingSpinner;
