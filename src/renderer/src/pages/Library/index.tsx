/**
 * 书库页面
 */
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { Plus, BookOpen, FolderOpen } from '../../utils/icons';
import { toast } from '../../components/Toast';
import type { Book } from '@shared/types';

export function Library() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();

  // 获取书籍列表
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      return await api.book.getAll();
    },
  });

  // 导入书籍
  const importMutation = useMutation({
    mutationFn: async () => {
      const result = await api.file.select({
        title: '选择 EPUB 文件',
        filters: [
          {
            name: 'EPUB',
            extensions: ['epub'],
          },
        ],
        properties: ['openFile'],
      });

      if (result.length === 0) {
        return null; // 用户取消选择
      }

      return await api.book.import(result[0]);
    },
    onSuccess: (book: Book | null) => {
      if (!book) {
        return; // 用户取消选择
      }
      
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success(`成功导入《${book.title}》`);
      
      // 直接打开导入的书籍
      navigate(`/reader/${book.id}`);
    },
    onError: (error) => {
      console.error('Failed to import book:', error);
      const errorMessage = error instanceof Error ? error.message : '导入失败';
      toast.error(`导入书籍失败: ${errorMessage}`);
    },
  });

  // 打开书籍
  const handleOpenBook = (bookId: string) => {
    navigate(`/reader/${bookId}`);
  };

  // 获取封面 URL（处理本地文件路径）
  const getCoverUrl = (book: Book): string => {
    if (book.coverUrl) {
      // 本地文件路径需要转换为 file:// 协议
      return `file://${book.coverUrl}`;
    }
    // 默认封面
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
        <rect fill="#e5e7eb" width="200" height="300"/>
        <text x="100" y="150" font-family="sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">${book.title.charAt(0)}</text>
      </svg>
    `);
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部栏 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的书库</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {books.length === 0 ? '还没有导入任何书籍' : `共 ${books.length} 本书籍`}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              <span>{importMutation.isPending ? '导入中...' : '导入书籍'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 书籍列表 */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
              <p className="text-sm text-gray-500">正在加载...</p>
            </div>
          </div>
        ) : books.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-6">
                <FolderOpen className="mx-auto h-24 w-24 text-gray-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">还没有书籍</h3>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                点击上方"导入书籍"按钮，选择 EPUB 文件导入
              </p>
              <button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                <span>导入第一本书</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {books.map((book: Book) => (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book.id)}
                className="group cursor-pointer"
              >
                {/* 书籍封面 */}
                <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-xl">
                  <img
                    src={getCoverUrl(book)}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      // 图片加载失败时显示默认封面
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
                          <rect fill="#e5e7eb" width="200" height="300"/>
                          <text x="100" y="150" font-family="sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">${book.title.charAt(0)}</text>
                        </svg>
                      `);
                    }}
                  />

                  {/* 阅读进度遮罩 */}
                  {book.progress > 0 && book.progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 p-2">
                      <div className="h-1 overflow-hidden rounded-full bg-blue-400">
                        <div
                          className="h-full bg-white"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 悬浮时显示的图标 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                </div>

                {/* 书籍信息 */}
                <div className="space-y-1">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {book.author}
                  </p>

                  {/* 阅读进度文字 */}
                  {book.lastReadAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {book.progress > 0 ? `已读 ${book.progress.toFixed(0)}%` : '未开始'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Library;
