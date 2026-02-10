/**
 * 书籍卡片组件 - 使用 React.memo 优化
 */
import { memo } from 'react';
import type { Book } from '@shared/types';

interface BookCardProps {
  book: Book & { tags: any[] };
  coverUrl?: string;
  onClick: () => void;
  onViewDetails: (e: React.MouseEvent) => void;
  isBatchMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export const BookCard = memo(function BookCard({
  book,
  coverUrl,
  onClick,
  onViewDetails,
  isBatchMode,
  isSelected,
  onSelect,
}: BookCardProps) {
  return (
    <div
      className={`group relative flex flex-col space-y-3 rounded-lg border bg-white p-4 transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {/* 批量选择复选框 */}
      {isBatchMode && (
        <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onSelect}
            className={`rounded p-1.5 transition-colors ${
              isSelected
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                : 'bg-white/80 text-gray-400 hover:bg-gray-100 dark:bg-gray-800/80'
            }`}
          >
            {isSelected ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* 封面 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 shadow-sm">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* 查看详情按钮 */}
        <button
          onClick={onViewDetails}
          className="absolute right-2 top-2 rounded bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
          title="查看详情"
        >
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* 标题 */}
      <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
        {book.title}
      </h3>

      {/* 作者 */}
      <p className="line-clamp-1 text-xs text-gray-600 dark:text-gray-400">
        {book.author}
      </p>

      {/* 阅读进度 */}
      {book.progressPercentage !== undefined && book.progressPercentage > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${book.progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {book.progressPercentage.toFixed(1)}%
          </p>
        </div>
      )}

      {/* 标签 */}
      {book.tags && book.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {book.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: tag.color || '#3b82f6',
                color: 'white',
              }}
            >
              {tag.name}
            </span>
          ))}
          {book.tags.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              +{book.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default BookCard;
