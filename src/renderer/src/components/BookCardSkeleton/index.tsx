/**
 * 书籍卡片骨架屏
 */
import { SkeletonLoader } from '../LoadingSpinner';

interface BookCardSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function BookCardSkeleton({ count = 6, viewMode = 'grid' }: BookCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* 封面 */}
            <SkeletonLoader variant="circle" className="h-16 w-16 flex-shrink-0" />
            {/* 信息 */}
            <div className="flex-1 space-y-2">
              <SkeletonLoader className="h-5 w-3/4" />
              <SkeletonLoader className="h-4 w-1/2" />
              <SkeletonLoader className="h-4 w-1/3" />
            </div>
            {/* 操作 */}
            <SkeletonLoader className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          {/* 封面 */}
          <SkeletonLoader variant="card" className="aspect-[3/4] w-full" />
          {/* 标题 */}
          <SkeletonLoader className="h-4 w-full" />
          {/* 作者 */}
          <SkeletonLoader className="h-3 w-2/3" />
          {/* 进度 */}
          <SkeletonLoader className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export default BookCardSkeleton;
