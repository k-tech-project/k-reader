/**
 * 书籍详情页
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { toast } from '../../components/Toast';
import { modal } from '../../components/Modal';
import { TagManager } from '../../components/TagManager';
import type { Book } from '@shared/types';
import type { Tag } from '@shared/types';
import { ArrowLeft, BookOpen, Trash2, Share, Calendar, Clock, FileText, Bookmark, Highlight, Book as BookIcon, Edit, Save, X, Tag as TagIcon } from '../../utils/icons';

export function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [coverLoaded, setCoverLoaded] = useState(false);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState<Partial<Book>>({});

  // 标签管理状态
  const [showTagManager, setShowTagManager] = useState(false);

  // 获取书籍信息
  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      return await api.book.get(bookId);
    },
    enabled: !!bookId,
  });

  // 获取书籍的批注数量
  const { data: highlights = [] } = useQuery({
    queryKey: ['highlights-count', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: 'highlight' });
    },
    enabled: !!bookId,
  });

  // 获取书籍的书签数量
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks-count', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: 'bookmark' });
    },
    enabled: !!bookId,
  });

  // 获取书籍的标签
  const { data: bookTags = [], refetch: refetchTags } = useQuery({
    queryKey: ['bookTags', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.tag.getByBook(bookId);
    },
    enabled: !!bookId,
  });

  // 加载封面
  useEffect(() => {
    const loadCover = async () => {
      if (!book?.coverUrl) return;

      try {
        const buffer = await api.file.read(book.coverUrl);
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const blobUrl = URL.createObjectURL(blob);
        setCoverUrl(blobUrl);
        setCoverLoaded(true);
      } catch (error) {
        console.error('Failed to load cover:', error);
        setCoverLoaded(false);
      }
    };

    loadCover();

    return () => {
      if (coverUrl && coverUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverUrl);
      }
    };
  }, [book?.coverUrl]);

  // 返回书库
  const handleBack = () => {
    navigate('/library');
  };

  // 开始阅读
  const handleRead = () => {
    if (bookId) {
      navigate(`/reader/${bookId}`);
    }
  };

  // 删除书籍
  const deleteBookMutation = useMutation({
    mutationFn: async () => {
      if (!bookId) return;
      await api.book.delete(bookId);
    },
    onSuccess: () => {
      toast.success('书籍已删除');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      navigate('/library');
    },
    onError: (error) => {
      console.error('Failed to delete book:', error);
      toast.error('删除书籍失败');
    },
  });

  // 确认删除
  const handleDelete = () => {
    modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            确定要删除这本书吗？
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            删除后，所有阅读进度和批注都将被删除，此操作无法撤销。
          </p>
        </div>
      ),
    });
  };

  // 导出书籍批注
  const handleExport = async () => {
    try {
      // 使用模态框让用户选择导出格式
      modal.custom({
        title: '导出批注',
        size: 'sm',
        content: (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              选择导出格式
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={async () => {
                  modal.close();
                  await exportAnnotations('markdown');
                }}
                className="flex items-center space-x-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Markdown</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">适用于笔记软件和文档编辑</p>
                </div>
              </button>
              <button
                onClick={async () => {
                  modal.close();
                  await exportAnnotations('json');
                }}
                className="flex items-center space-x-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">JSON</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">数据格式，便于程序处理</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => modal.close()}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        ),
        showFooter: false,
      });
    } catch (error) {
      console.error('Failed to open export dialog:', error);
    }
  };

  // 分享书籍
  const handleShare = async () => {
    toast.info('分享功能即将推出');
  };

  // 导出批注
  const exportAnnotations = async (format: 'markdown' | 'json') => {
    if (!bookId) return;

    try {
      const result = await api.annotation.export({ bookId, format });

      if (!result.success || !result.data) {
        toast.error(result.error || '导出失败');
        return;
      }

      // 使用文件保存对话框
      const defaultFileName = `${book?.title || 'annotations'}-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : 'json'}`;

      const savePath = await api.file.select({
        title: '保存批注文件',
        defaultPath: defaultFileName,
        filters: [
          {
            name: format === 'markdown' ? 'Markdown' : 'JSON',
            extensions: [format === 'markdown' ? 'md' : 'json'],
          },
        ],
        properties: ['saveFile'],
      });

      if (savePath.length === 0) {
        return; // 用户取消
      }

      await api.file.write(savePath[0], result.data);
      toast.success(`批注已导出到 ${savePath[0]}`);
    } catch (error) {
      console.error('Failed to export annotations:', error);
      toast.error('导出批注失败');
    }
  };

  // 开始编辑
  const handleEdit = () => {
    if (!book) return;
    setEditedBook({
      title: book.title,
      author: book.author,
      description: book.description,
    });
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedBook({});
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!book || !bookId) return;

    try {
      await api.book.update(bookId, editedBook);
      toast.success('书籍信息已更新');
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsEditing(false);
      setEditedBook({});
    } catch (error) {
      console.error('Failed to update book:', error);
      toast.error('更新书籍信息失败');
    }
  };

  // 获取封面 URL
  const getCoverUrl = (): string => {
    if (coverUrl && coverLoaded) {
      return coverUrl;
    }

    // 默认封面
    if (book) {
      return 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
          <rect fill="#e5e7eb" width="400" height="600"/>
          <text x="200" y="300" font-family="sans-serif" font-size="32" fill="#9ca3af" text-anchor="middle">{book.title.charAt(0)}</text>
        </svg>
      `);
    }

    return '';
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化日期
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <BookIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">书籍不存在</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            返回书库
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: '总页数', value: `${book.totalPages || '未知'} 页`, icon: FileText },
    { label: '添加时间', value: formatDate(book.addedAt), icon: Calendar },
    { label: '最后阅读', value: book.lastReadAt ? formatDate(book.lastReadAt) : '未开始', icon: Clock },
    { label: '高亮批注', value: `${highlights.length} 条`, icon: Highlight },
    { label: '书签', value: `${bookmarks.length} 个`, icon: Bookmark },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-1">
              书籍详情
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              title="编辑书籍信息"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleShare}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            title="分享"
          >
            <Share className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            title="导出"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title="删除书籍"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* 书籍信息卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
            {/* 封面和信息 */}
            <div className="flex flex-col md:flex-row">
              {/* 封面 */}
              <div className="md:w-48 md:h-64 md:flex-shrink-0">
                <div className="h-64 md:h-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={getCoverUrl()}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* 基本信息 */}
              <div className="flex-1 p-6">
                {isEditing ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        书名
                      </label>
                      <input
                        type="text"
                        value={editedBook.title || ''}
                        onChange={(e) => setEditedBook({ ...editedBook, title: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        作者
                      </label>
                      <input
                        type="text"
                        value={editedBook.author || ''}
                        onChange={(e) => setEditedBook({ ...editedBook, author: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        简介
                      </label>
                      <textarea
                        value={editedBook.description || ''}
                        onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {book.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                      {book.author}
                    </p>

                    {/* 统计信息 */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${book.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {book.progress ? `${book.progress.toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        阅读进度
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <button
                      onClick={handleRead}
                      className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      继续阅读
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 详细信息 */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">详细信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <stat.icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 书籍描述 */}
          {book.description && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">简介</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{book.description}</p>
            </div>
          )}

          {/* 标签管理 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">标签</h3>
              <button
                onClick={() => setShowTagManager(true)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <TagIcon className="h-4 w-4" />
                <span>管理标签</span>
              </button>
            </div>
            {bookTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bookTags.map((tag: Tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: tag.color + '30',
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">暂无标签</p>
            )}
          </div>

          {/* 元数据 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">元数据</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">文件名</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{book.fileName || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">文件大小</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatFileSize(book.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">创建时间</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatDate(book.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">格式</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{book.format || 'EPUB'}</dd>
              </div>
            </dl>
          </div>

          {/* 批注统计 */}
          {(highlights.length > 0 || bookmarks.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">我的批注</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Highlight className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{highlights.length}</span>
                  <span className="text-gray-600 dark:text-gray-400">个高亮</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Bookmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{bookmarks.length}</span>
                  <span className="text-gray-600 dark:text-gray-400">个书签</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigate(`/reader/${bookId}`);
                  // TODO: 打开阅读器后自动切换到高亮标签页
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                查看全部批注 →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 标签管理弹窗 */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">标签管理</h3>
              <button
                onClick={() => {
                  setShowTagManager(false);
                  refetchTags();
                }}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <TagManager
                bookId={bookId}
                onClose={() => {
                  setShowTagManager(false);
                  refetchTags();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetail;
