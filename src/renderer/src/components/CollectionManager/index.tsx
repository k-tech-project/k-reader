/**
 * 书架管理组件
 * 用于创建、编辑和删除书架
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { modal } from '../Modal';
import { toast } from '../Toast';
import { Plus, Edit, Trash2, X, FolderCollection } from '../../utils/icons';
import type { Collection } from '@shared/types';

interface CollectionManagerProps {
  bookId?: string;
  onClose?: () => void;
}

export function CollectionManager({ bookId, onClose }: CollectionManagerProps) {
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  // 获取所有书架
  const { data: allCollections = [], isLoading: isLoadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      return await api.collection.getAll();
    },
  });

  // 获取书籍所属的书架
  const { data: bookCollections = [], isLoading: isLoadingBookCollections } = useQuery({
    queryKey: ['bookCollections', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.collection.getByBook(bookId);
    },
    enabled: !!bookId,
  });

  // 创建书架
  const createMutation = useMutation({
    mutationFn: async () => {
      return await api.collection.create({
        name: newCollectionName,
        description: newCollectionDesc,
      });
    },
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success(`书架 "${collection.name}" 创建成功`);
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowCreateForm(false);
    },
    onError: (error) => {
      console.error('Failed to create collection:', error);
      toast.error('创建书架失败');
    },
  });

  // 更新书架
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; description?: string } }) => {
      return await api.collection.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('书架更新成功');
      setEditingCollection(null);
    },
    onError: (error) => {
      console.error('Failed to update collection:', error);
      toast.error('更新书架失败');
    },
  });

  // 删除书架
  const deleteMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      return await api.collection.delete(collectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('书架删除成功');
    },
    onError: (error) => {
      console.error('Failed to delete collection:', error);
      toast.error('删除书架失败');
    },
  });

  // 添加书籍到书架
  const addToCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      if (!bookId) throw new Error('Book ID is required');
      return await api.collection.addBook({ collectionId, bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookCollections', bookId] });
    },
    onError: (error) => {
      console.error('Failed to add book to collection:', error);
      toast.error('添加到书架失败');
    },
  });

  // 从书架移除书籍
  const removeFromCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      if (!bookId) throw new Error('Book ID is required');
      return await api.collection.removeBook({ collectionId, bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookCollections', bookId] });
    },
    onError: (error) => {
      console.error('Failed to remove book from collection:', error);
      toast.error('从书架移除失败');
    },
  });

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error('请输入书架名称');
      return;
    }
    createMutation.mutate();
  };

  const handleUpdateCollection = () => {
    if (!editingCollection) return;
    updateMutation.mutate({
      id: editingCollection.id,
      updates: { name: editingCollection.name, description: editingCollection.description },
    });
  };

  const handleDeleteCollection = async (collection: Collection) => {
    const confirmed = await modal.confirm({
      title: '删除书架',
      content: (
        <div>
          <p className="mb-2">确定要删除书架 "{collection.name}" 吗？</p>
          <p className="text-sm text-gray-500">删除后，该书架中的所有书籍将不再归属于此书架。</p>
        </div>
      ),
    });

    if (confirmed) {
      deleteMutation.mutate(collection.id);
    }
  };

  const isBookInCollection = (collectionId: string) => {
    return bookCollections.some((c) => c.id === collectionId);
  };

  if (isLoadingCollections || isLoadingBookCollections) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 创建书架表单 */}
      {showCreateForm ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">创建新书架</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewCollectionName('');
                setNewCollectionDesc('');
              }}
              className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="书架名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />

            <textarea
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              placeholder="描述（可选）"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            />

            <button
              onClick={handleCreateCollection}
              disabled={createMutation.isPending || !newCollectionName.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? '创建中...' : '创建书架'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex w-full items-center justify-center space-x-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>创建新书架</span>
        </button>
      )}

      {/* 书架列表 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {bookId ? '选择书架添加书籍' : '所有书架'}
        </h3>

        {allCollections.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
            暂无书架，请创建新书架
          </p>
        ) : (
          <div className="space-y-2">
            {allCollections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FolderCollection className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {collection.name}
                    </p>
                    {collection.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {collection.bookCount || 0} 本书
                    </p>
                  </div>
                  {bookId && isBookInCollection(collection.id) && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex-shrink-0">
                      已添加
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {bookId ? (
                    // 书籍书架管理模式
                    isBookInCollection(collection.id) ? (
                      <button
                        onClick={() => removeFromCollectionMutation.mutate(collection.id)}
                        disabled={removeFromCollectionMutation.isPending}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                        title="从书架移除"
                      >
                        移除
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCollectionMutation.mutate(collection.id)}
                        disabled={addToCollectionMutation.isPending}
                        className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
                        title="添加到书架"
                      >
                        添加
                      </button>
                    )
                  ) : (
                    // 书架管理模式
                    <>
                      <button
                        onClick={() => setEditingCollection(collection)}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                        title="编辑书架"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection)}
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
                        title="删除书架"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 编辑书架弹窗 */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                编辑书架
              </h3>
              <button
                onClick={() => setEditingCollection(null)}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  书架名称
                </label>
                <input
                  type="text"
                  value={editingCollection.name}
                  onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  描述
                </label>
                <textarea
                  value={editingCollection.description || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingCollection(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateCollection}
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionManager;
