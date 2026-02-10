/**
 * 书库页面
 */
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { Plus, BookOpen, FolderOpen, Search, X, List as ListIcon, Squares2x2, Info, ArrowUpDown, ChevronDown, Filter, Tag as TagIcon, FolderCollection, Trash2, CheckSquare, Square } from '../../utils/icons';
import { toast } from '../../components/Toast';
import { modal } from '../../components/Modal';
import { TagManager } from '../../components/TagManager';
import { CollectionManager } from '../../components/CollectionManager';
import { BookCardSkeleton } from '../../components/BookCardSkeleton';
import type { Book } from '@shared/types';
import type { Tag } from '@shared/types';
import { useEffect, useState } from 'react';

export function Library() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');

  // 视图模式
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 排序状态
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'addedAt' | 'lastReadAt' | 'progress'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'reading' | 'finished'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 标签筛选状态
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);

  // 批量选择状态
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [showBatchActionMenu, setShowBatchActionMenu] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);

  // 获取所有标签
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      return await api.tag.getAll();
    },
  });

  // 从本地存储加载视图模式偏好
  useEffect(() => {
    const savedViewMode = localStorage.getItem('library:viewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  // 切换视图模式
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('library:viewMode', newMode);
  };

  // 获取书籍列表
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const booksData = await api.book.getAll();
      // 为每本书获取标签
      const booksWithTags = await Promise.all(
        booksData.map(async (book) => ({
          ...book,
          tags: await api.tag.getByBook(book.id),
        }))
      );
      return booksWithTags;
    },
  });

  // 搜索过滤和排序
  const filteredAndSortedBooks = books
    .filter((book) => {
      // 搜索过滤
      if (!searchQuery.trim()) {
        // 搜索为空时也通过
      } else {
        const query = searchQuery.toLowerCase();
        if (
          !book.title.toLowerCase().includes(query) &&
          !book.author.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 状态筛选
      switch (filterStatus) {
        case 'unread':
          return !book.lastReadAt || book.progress === 0;
        case 'reading':
          return book.lastReadAt && book.progress > 0 && book.progress < 100;
        case 'finished':
          return book.progress === 100;
        default:
          return true;
      }

      // 标签筛选 - 至少包含一个选中的标签
      if (selectedTagIds.length > 0) {
        const bookTagIds = (book.tags || []).map((t: Tag) => t.id);
        return selectedTagIds.some((tagId) => bookTagIds.includes(tagId));
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author, 'zh-CN');
          break;
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'lastReadAt':
          const aTime = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
          const bTime = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        case 'progress':
          comparison = (a.progress || 0) - (b.progress || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
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

  // 加载封面
  useEffect(() => {
    const loadCovers = async () => {
      const urls: Record<string, string> = {};
      
      for (const book of books) {
        if (book.coverUrl) {
          try {
            // 通过 IPC 读取封面文件
            const buffer = await api.file.read(book.coverUrl);
            
            // 将 Buffer 转换为 Blob URL
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            const blobUrl = URL.createObjectURL(blob);
            urls[book.id] = blobUrl;
          } catch (error) {
            console.error(`Failed to load cover for ${book.title}:`, error);
          }
        }
      }
      
      setCoverUrls(urls);
    };
    
    if (books.length > 0) {
      loadCovers();
    }
    
    // 清理 blob URLs
    return () => {
      Object.values(coverUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [books, api.file]);

  // 打开书籍
  const handleOpenBook = (bookId: string) => {
    navigate(`/reader/${bookId}`);
  };

  // 查看书籍详情
  const handleViewDetails = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${bookId}`);
  };

  // 批量操作 - 切换选择模式
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedBookIds(new Set());
    setShowBatchActionMenu(false);
  };

  // 批量操作 - 切换书籍选择
  const toggleBookSelection = (bookId: string) => {
    const newSelected = new Set(selectedBookIds);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBookIds(newSelected);
  };

  // 批量操作 - 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedBookIds.size === filteredAndSortedBooks.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(filteredAndSortedBooks.map((b) => b.id)));
    }
  };

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: async (bookIds: string[]) => {
      for (const bookId of bookIds) {
        await api.book.delete(bookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success(`成功删除 ${selectedBookIds.size} 本书籍`);
      setSelectedBookIds(new Set());
      setIsBatchMode(false);
    },
    onError: (error) => {
      console.error('Failed to batch delete books:', error);
      toast.error('批量删除失败');
    },
  });

  // 批量添加到书架
  const batchAddToCollectionMutation = useMutation({
    mutationFn: async (data: { collectionId: string; bookIds: string[] }) => {
      for (const bookId of data.bookIds) {
        await api.collection.addBook({ collectionId: data.collectionId, bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success(`成功添加 ${selectedBookIds.size} 本书籍到书架`);
      setSelectedBookIds(new Set());
      setIsBatchMode(false);
      setShowCollectionManager(false);
    },
    onError: (error) => {
      console.error('Failed to batch add to collection:', error);
      toast.error('批量添加到书架失败');
    },
  });

  // 批量添加标签
  const batchAddTagMutation = useMutation({
    mutationFn: async (data: { tagId: string; bookIds: string[] }) => {
      for (const bookId of data.bookIds) {
        await api.tag.addToBook({ bookId, tagId: data.tagId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(`成功添加标签到 ${selectedBookIds.size} 本书籍`);
      setSelectedBookIds(new Set());
      setIsBatchMode(false);
    },
    onError: (error) => {
      console.error('Failed to batch add tag:', error);
      toast.error('批量添加标签失败');
    },
  });

  // 处理批量删除
  const handleBatchDelete = async () => {
    const confirmed = await modal.confirm({
      title: '批量删除书籍',
      content: (
        <div>
          <p className="mb-2">确定要删除选中的 {selectedBookIds.size} 本书籍吗？</p>
          <p className="text-sm text-gray-500">此操作无法撤销。</p>
        </div>
      ),
    });

    if (confirmed) {
      batchDeleteMutation.mutate(Array.from(selectedBookIds));
    }
  };

  // 获取封面 URL
  const getCoverUrl = (book: Book): string => {
    // 如果已经加载了 blob URL
    if (coverUrls[book.id]) {
      return coverUrls[book.id];
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
              {books.length === 0 ? '还没有导入任何书籍' :
                searchQuery ? `找到 ${filteredAndSortedBooks.length} 本书籍（共 ${books.length} 本）` :
                `共 ${books.length} 本书籍`
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* 批量选择按钮 */}
            <button
              onClick={toggleBatchMode}
              className={`rounded-lg border p-2 transition-colors ${
                isBatchMode
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              title={isBatchMode ? '退出批量选择' : '批量选择'}
            >
              {isBatchMode ? (
                <X className="h-5 w-5" />
              ) : (
                <CheckSquare className="h-5 w-5" />
              )}
            </button>

            {/* 批量选择模式下的操作栏 */}
            {isBatchMode && selectedBookIds.size > 0 && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已选择 {selectedBookIds.size} 本
                </span>
                <button
                  onClick={() => setShowBatchActionMenu(!showBatchActionMenu)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  批量操作
                </button>
              </>
            )}

            {/* 视图切换按钮 */}
            <button
              onClick={toggleViewMode}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title={viewMode === 'grid' ? '切换到列表视图' : '切换到网格视图'}
            >
              {viewMode === 'grid' ? (
                <ListIcon className="h-5 w-5" />
              ) : (
                <Squares2x2 className="h-5 w-5" />
              )}
            </button>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索书籍..."
                className="w-64 pl-10 pr-8 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 标签筛选 */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-2">
                <TagIcon className="h-4 w-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 3).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'text-white'
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: selectedTagIds.includes(tag.id)
                          ? tag.color
                          : tag.color + '40',
                        color: selectedTagIds.includes(tag.id)
                          ? 'white'
                          : tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {allTags.length > 3 && (
                    <button
                      onClick={() => setShowTagManager(true)}
                      className="px-2 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      +{allTags.length - 3}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 标签管理按钮 */}
            <button
              onClick={() => setShowTagManager(true)}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title="标签管理"
            >
              <TagIcon className="h-5 w-5" />
            </button>

            {/* 筛选按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center space-x-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  filterStatus !== 'all'
                    ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>筛选</span>
                {filterStatus !== 'all' && (
                  <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                    {filterStatus === 'unread' ? '未读' :
                    filterStatus === 'reading' ? '阅读中' :
                    filterStatus === 'finished' ? '已完成' : ''}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* 筛选下拉菜单 */}
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 space-y-1">
                    {[
                      { value: 'all', label: '全部书籍' },
                      { value: 'unread', label: '未开始' },
                      { value: 'reading', label: '阅读中' },
                      { value: 'finished', label: '已完成' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterStatus(option.value as any);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          filterStatus === option.value
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 排序按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>排序</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* 排序下拉菜单 */}
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 space-y-1">
                    {[
                      { value: 'addedAt', label: '添加时间' },
                      { value: 'title', label: '书名' },
                      { value: 'author', label: '作者' },
                      { value: 'lastReadAt', label: '最后阅读' },
                      { value: 'progress', label: '阅读进度' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            // 如果已选择该字段，切换排序顺序
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(option.value as any);
                            setSortOrder('desc');
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                          sortBy === option.value
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 批量操作菜单 */}
              {showBatchActionMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowBatchActionMenu(false);
                        setShowCollectionManager(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <FolderCollection className="h-4 w-4" />
                      <span>添加到书架</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowBatchActionMenu(false);
                        setShowTagManager(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <TagIcon className="h-4 w-4" />
                      <span>添加标签</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowBatchActionMenu(false);
                        handleBatchDelete();
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>删除选中书籍</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
          <BookCardSkeleton count={12} viewMode={viewMode} />
        ) : filteredAndSortedBooks.length === 0 && books.length > 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-6">
                <Search className="mx-auto h-24 w-24 text-gray-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">未找到匹配的书籍</h3>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                尝试使用不同的关键词搜索
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
                <span>清除搜索</span>
              </button>
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
          <>
            {/* 网格视图 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredAndSortedBooks.map((book: Book) => (
              <div
                key={book.id}
                onClick={() => !isBatchMode && handleOpenBook(book.id)}
                className={`group relative cursor-pointer ${isBatchMode ? 'cursor-default' : ''}`}
              >
                {/* 批量选择复选框 */}
                {isBatchMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookSelection(book.id);
                    }}
                    className="absolute top-2 left-2 z-10 rounded-full bg-white/90 p-2 shadow-md hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 transition-colors"
                  >
                    {selectedBookIds.has(book.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                )}

                {/* 书籍封面 */}
                <div className={`relative mb-3 aspect-[2/3] overflow-hidden rounded-lg shadow-md transition-all ${isBatchMode ? '' : 'group-hover:shadow-xl'}`}>
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
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleViewDetails(book.id, e)}
                        className="rounded-full bg-white/90 p-3 text-gray-700 hover:bg-white transition-colors"
                        title="查看详情"
                      >
                        <Info className="h-6 w-6" />
                      </button>
                      <BookOpen className="h-12 w-12 text-white" />
                    </div>
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

                  {/* 标签 */}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.slice(0, 2).map((tag: Tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: tag.color + '30',
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {book.tags.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{book.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

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

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredAndSortedBooks.map((book: Book) => (
                  <div
                    key={book.id}
                    onClick={() => !isBatchMode && handleOpenBook(book.id)}
                    className={`group flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-all ${isBatchMode ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'}`}
                  >
                    {/* 批量选择复选框 */}
                    {isBatchMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookSelection(book.id);
                        }}
                        className="flex-shrink-0"
                      >
                        {selectedBookIds.has(book.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* 封面 */}
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                      <img
                        src={getCoverUrl(book)}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64">
                              <rect fill="#e5e7eb" width="48" height="64"/>
                              <text x="24" y="32" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">{book.title.charAt(0)}</text>
                            </svg>
                          `);
                        }}
                      />
                    </div>

                    {/* 书籍信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {book.author}
                      </p>

                      {/* 标签 */}
                      {book.tags && book.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {book.tags.slice(0, 3).map((tag: Tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: tag.color + '30',
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {book.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{book.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                        {book.lastReadAt && (
                          <span>{book.progress > 0 ? `已读 ${book.progress.toFixed(0)}%` : '未开始'}</span>
                        )}
                        {book.addedAt && (
                          <span>添加于 {new Date(book.addedAt).toLocaleDateString('zh-CN')}</span>
                        )}
                      </div>

                      {/* 进度条 */}
                      {book.progress > 0 && book.progress < 100 && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 阅读按钮 */}
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={(e) => handleViewDetails(book.id, e)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="查看详情"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        阅读
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 标签管理弹窗 */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">标签管理</h3>
              <button
                onClick={() => setShowTagManager(false)}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isBatchMode ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    为选中的 {selectedBookIds.size} 本书籍添加标签
                  </p>
                  <TagManager onClose={() => setShowTagManager(false)} />
                </div>
              ) : (
                <TagManager onClose={() => setShowTagManager(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 书架管理弹窗 */}
      {showCollectionManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isBatchMode ? `添加 ${selectedBookIds.size} 本书到书架` : '书架管理'}
              </h3>
              <button
                onClick={() => setShowCollectionManager(false)}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <CollectionManager onClose={() => setShowCollectionManager(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
