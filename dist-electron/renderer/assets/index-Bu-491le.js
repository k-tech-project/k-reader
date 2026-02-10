import { u as useQueryClient, r as reactExports, t as toast, j as jsxRuntimeExports, X, P as Plus, F as FolderCollection, E as Edit, T as Trash2, m as modal, S as SkeletonLoader, a as useNavigate, C as CheckSquare, L as List, b as Squares2x2, c as Search, d as Tag, e as Filter, f as ChevronDown, A as ArrowUpDown, g as FolderOpen, h as Square, I as Info, B as BookOpen } from "./index-RTiwXa8_.js";
import { u as useElectronAPI, a as useQuery, b as useMutation } from "./useElectronAPI-Xat-dAEw.js";
import { T as TagManager } from "./index-B8fUaEoU.js";
function CollectionManager({ bookId, onClose }) {
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [editingCollection, setEditingCollection] = reactExports.useState(null);
  const [showCreateForm, setShowCreateForm] = reactExports.useState(false);
  const [newCollectionName, setNewCollectionName] = reactExports.useState("");
  const [newCollectionDesc, setNewCollectionDesc] = reactExports.useState("");
  const { data: allCollections = [], isLoading: isLoadingCollections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      return await api.collection.getAll();
    }
  });
  const { data: bookCollections = [], isLoading: isLoadingBookCollections } = useQuery({
    queryKey: ["bookCollections", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.collection.getByBook(bookId);
    },
    enabled: !!bookId
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      return await api.collection.create({
        name: newCollectionName,
        description: newCollectionDesc
      });
    },
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(`书架 "${collection.name}" 创建成功`);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setShowCreateForm(false);
    },
    onError: (error) => {
      console.error("Failed to create collection:", error);
      toast.error("创建书架失败");
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await api.collection.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("书架更新成功");
      setEditingCollection(null);
    },
    onError: (error) => {
      console.error("Failed to update collection:", error);
      toast.error("更新书架失败");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (collectionId) => {
      return await api.collection.delete(collectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("书架删除成功");
    },
    onError: (error) => {
      console.error("Failed to delete collection:", error);
      toast.error("删除书架失败");
    }
  });
  const addToCollectionMutation = useMutation({
    mutationFn: async (collectionId) => {
      if (!bookId) throw new Error("Book ID is required");
      return await api.collection.addBook({ collectionId, bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookCollections", bookId] });
    },
    onError: (error) => {
      console.error("Failed to add book to collection:", error);
      toast.error("添加到书架失败");
    }
  });
  const removeFromCollectionMutation = useMutation({
    mutationFn: async (collectionId) => {
      if (!bookId) throw new Error("Book ID is required");
      return await api.collection.removeBook({ collectionId, bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookCollections", bookId] });
    },
    onError: (error) => {
      console.error("Failed to remove book from collection:", error);
      toast.error("从书架移除失败");
    }
  });
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error("请输入书架名称");
      return;
    }
    createMutation.mutate();
  };
  const handleUpdateCollection = () => {
    if (!editingCollection) return;
    updateMutation.mutate({
      id: editingCollection.id,
      updates: { name: editingCollection.name, description: editingCollection.description }
    });
  };
  const handleDeleteCollection = async (collection) => {
    const confirmed = await modal.confirm({
      title: "删除书架",
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2", children: [
          '确定要删除书架 "',
          collection.name,
          '" 吗？'
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "删除后，该书架中的所有书籍将不再归属于此书架。" })
      ] })
    });
    if (confirmed) {
      deleteMutation.mutate(collection.id);
    }
  };
  const isBookInCollection = (collectionId) => {
    return bookCollections.some((c) => c.id === collectionId);
  };
  if (isLoadingCollections || isLoadingBookCollections) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    showCreateForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "创建新书架" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setShowCreateForm(false);
              setNewCollectionName("");
              setNewCollectionDesc("");
            },
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: newCollectionName,
            onChange: (e) => setNewCollectionName(e.target.value),
            placeholder: "书架名称",
            className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: newCollectionDesc,
            onChange: (e) => setNewCollectionDesc(e.target.value),
            placeholder: "描述（可选）",
            rows: 2,
            className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleCreateCollection,
            disabled: createMutation.isPending || !newCollectionName.trim(),
            className: "w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            children: createMutation.isPending ? "创建中..." : "创建书架"
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setShowCreateForm(true),
        className: "flex w-full items-center justify-center space-x-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "创建新书架" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: bookId ? "选择书架添加书籍" : "所有书架" }),
      allCollections.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-gray-400 dark:text-gray-500 py-4", children: "暂无书架，请创建新书架" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: allCollections.map((collection) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderCollection, { className: "h-5 w-5 text-gray-400 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: collection.name }),
                collection.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: collection.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500", children: [
                  collection.bookCount || 0,
                  " 本书"
                ] })
              ] }),
              bookId && isBookInCollection(collection.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex-shrink-0", children: "已添加" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center space-x-2 flex-shrink-0", children: bookId ? (
              // 书籍书架管理模式
              isBookInCollection(collection.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => removeFromCollectionMutation.mutate(collection.id),
                  disabled: removeFromCollectionMutation.isPending,
                  className: "rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors",
                  title: "从书架移除",
                  children: "移除"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => addToCollectionMutation.mutate(collection.id),
                  disabled: addToCollectionMutation.isPending,
                  className: "rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors",
                  title: "添加到书架",
                  children: "添加"
                }
              )
            ) : (
              // 书架管理模式
              /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setEditingCollection(collection),
                    className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
                    title: "编辑书架",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Edit, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => handleDeleteCollection(collection),
                    className: "rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors",
                    title: "删除书架",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] })
            ) })
          ]
        },
        collection.id
      )) })
    ] }),
    editingCollection && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "编辑书架" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setEditingCollection(null),
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "书架名称" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: editingCollection.name,
              onChange: (e) => setEditingCollection({ ...editingCollection, name: e.target.value }),
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "描述" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: editingCollection.description || "",
              onChange: (e) => setEditingCollection({ ...editingCollection, description: e.target.value }),
              rows: 3,
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end space-x-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setEditingCollection(null),
              className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleUpdateCollection,
              disabled: updateMutation.isPending,
              className: "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: updateMutation.isPending ? "保存中..." : "保存"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function BookCardSkeleton({ count = 6, viewMode = "grid" }) {
  if (viewMode === "list") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { variant: "circle", className: "h-16 w-16 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-5 w-3/4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-4 w-1/2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-4 w-1/3" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-8 w-20" })
        ]
      },
      index
    )) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { variant: "card", className: "aspect-[3/4] w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-4 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-3 w-2/3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonLoader, { className: "h-2 w-full" })
      ]
    },
    index
  )) });
}
function Library() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [coverUrls, setCoverUrls] = reactExports.useState({});
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [sortBy, setSortBy] = reactExports.useState("addedAt");
  const [sortOrder, setSortOrder] = reactExports.useState("desc");
  const [showSortMenu, setShowSortMenu] = reactExports.useState(false);
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const [showFilterMenu, setShowFilterMenu] = reactExports.useState(false);
  const [selectedTagIds, setSelectedTagIds] = reactExports.useState([]);
  const [showTagManager, setShowTagManager] = reactExports.useState(false);
  const [isBatchMode, setIsBatchMode] = reactExports.useState(false);
  const [selectedBookIds, setSelectedBookIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [showBatchActionMenu, setShowBatchActionMenu] = reactExports.useState(false);
  const [showCollectionManager, setShowCollectionManager] = reactExports.useState(false);
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return await api.tag.getAll();
    }
  });
  reactExports.useEffect(() => {
    const savedViewMode = localStorage.getItem("library:viewMode");
    if (savedViewMode === "grid" || savedViewMode === "list") {
      setViewMode(savedViewMode);
    }
  }, []);
  const toggleViewMode = () => {
    const newMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(newMode);
    localStorage.setItem("library:viewMode", newMode);
  };
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const booksData = await api.book.getAll();
      const booksWithTags = await Promise.all(
        booksData.map(async (book) => ({
          ...book,
          tags: await api.tag.getByBook(book.id)
        }))
      );
      return booksWithTags;
    }
  });
  const filteredAndSortedBooks = books.filter((book) => {
    if (!searchQuery.trim()) ;
    else {
      const query = searchQuery.toLowerCase();
      if (!book.title.toLowerCase().includes(query) && !book.author.toLowerCase().includes(query)) {
        return false;
      }
    }
    switch (filterStatus) {
      case "unread":
        return !book.lastReadAt || book.progress === 0;
      case "reading":
        return book.lastReadAt && book.progress > 0 && book.progress < 100;
      case "finished":
        return book.progress === 100;
      default:
        return true;
    }
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title, "zh-CN");
        break;
      case "author":
        comparison = a.author.localeCompare(b.author, "zh-CN");
        break;
      case "addedAt":
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        break;
      case "lastReadAt":
        const aTime = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
        const bTime = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
        comparison = aTime - bTime;
        break;
      case "progress":
        comparison = (a.progress || 0) - (b.progress || 0);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
  const importMutation = useMutation({
    mutationFn: async () => {
      const result = await api.file.select({
        title: "选择 EPUB 文件",
        filters: [
          {
            name: "EPUB",
            extensions: ["epub"]
          }
        ],
        properties: ["openFile"]
      });
      if (result.length === 0) {
        return null;
      }
      return await api.book.import(result[0]);
    },
    onSuccess: (book) => {
      if (!book) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(`成功导入《${book.title}》`);
      navigate(`/reader/${book.id}`);
    },
    onError: (error) => {
      console.error("Failed to import book:", error);
      const errorMessage = error instanceof Error ? error.message : "导入失败";
      toast.error(`导入书籍失败: ${errorMessage}`);
    }
  });
  reactExports.useEffect(() => {
    const loadCovers = async () => {
      const urls = {};
      for (const book of books) {
        if (book.coverUrl) {
          try {
            const buffer = await api.file.read(book.coverUrl);
            const blob = new Blob([buffer], { type: "image/jpeg" });
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
    return () => {
      Object.values(coverUrls).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [books, api.file]);
  const handleOpenBook = (bookId) => {
    navigate(`/reader/${bookId}`);
  };
  const handleViewDetails = (bookId, e) => {
    e.stopPropagation();
    navigate(`/book/${bookId}`);
  };
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedBookIds(/* @__PURE__ */ new Set());
    setShowBatchActionMenu(false);
  };
  const toggleBookSelection = (bookId) => {
    const newSelected = new Set(selectedBookIds);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBookIds(newSelected);
  };
  const batchDeleteMutation = useMutation({
    mutationFn: async (bookIds) => {
      for (const bookId of bookIds) {
        await api.book.delete(bookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(`成功删除 ${selectedBookIds.size} 本书籍`);
      setSelectedBookIds(/* @__PURE__ */ new Set());
      setIsBatchMode(false);
    },
    onError: (error) => {
      console.error("Failed to batch delete books:", error);
      toast.error("批量删除失败");
    }
  });
  useMutation({
    mutationFn: async (data) => {
      for (const bookId of data.bookIds) {
        await api.collection.addBook({ collectionId: data.collectionId, bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(`成功添加 ${selectedBookIds.size} 本书籍到书架`);
      setSelectedBookIds(/* @__PURE__ */ new Set());
      setIsBatchMode(false);
      setShowCollectionManager(false);
    },
    onError: (error) => {
      console.error("Failed to batch add to collection:", error);
      toast.error("批量添加到书架失败");
    }
  });
  useMutation({
    mutationFn: async (data) => {
      for (const bookId of data.bookIds) {
        await api.tag.addToBook({ bookId, tagId: data.tagId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(`成功添加标签到 ${selectedBookIds.size} 本书籍`);
      setSelectedBookIds(/* @__PURE__ */ new Set());
      setIsBatchMode(false);
    },
    onError: (error) => {
      console.error("Failed to batch add tag:", error);
      toast.error("批量添加标签失败");
    }
  });
  const handleBatchDelete = async () => {
    const confirmed = await modal.confirm({
      title: "批量删除书籍",
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2", children: [
          "确定要删除选中的 ",
          selectedBookIds.size,
          " 本书籍吗？"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "此操作无法撤销。" })
      ] })
    });
    if (confirmed) {
      batchDeleteMutation.mutate(Array.from(selectedBookIds));
    }
  };
  const getCoverUrl = (book) => {
    if (coverUrls[book.id]) {
      return coverUrls[book.id];
    }
    return "data:image/svg+xml," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
        <rect fill="#e5e7eb" width="200" height="300"/>
        <text x="100" y="150" font-family="sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">${book.title.charAt(0)}</text>
      </svg>
    `);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "我的书库" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: books.length === 0 ? "还没有导入任何书籍" : searchQuery ? `找到 ${filteredAndSortedBooks.length} 本书籍（共 ${books.length} 本）` : `共 ${books.length} 本书籍` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: toggleBatchMode,
            className: `rounded-lg border p-2 transition-colors ${isBatchMode ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"}`,
            title: isBatchMode ? "退出批量选择" : "批量选择",
            children: isBatchMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "h-5 w-5" })
          }
        ),
        isBatchMode && selectedBookIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-px bg-gray-300 dark:bg-gray-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
            "已选择 ",
            selectedBookIds.size,
            " 本"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setShowBatchActionMenu(!showBatchActionMenu),
              className: "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors",
              children: "批量操作"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: toggleViewMode,
            className: "rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors",
            title: viewMode === "grid" ? "切换到列表视图" : "切换到网格视图",
            children: viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Squares2x2, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              placeholder: "搜索书籍...",
              className: "w-64 pl-10 pr-8 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSearchQuery(""),
              className: "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
            }
          )
        ] }),
        allTags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4 text-gray-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
            allTags.slice(0, 3).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setSelectedTagIds(
                    (prev) => prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  );
                },
                className: `px-2 py-1 rounded-full text-xs font-medium transition-colors ${selectedTagIds.includes(tag.id) ? "text-white" : "hover:opacity-80"}`,
                style: {
                  backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : tag.color + "40",
                  color: selectedTagIds.includes(tag.id) ? "white" : tag.color
                },
                children: tag.name
              },
              tag.id
            )),
            allTags.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setShowTagManager(true),
                className: "px-2 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors",
                children: [
                  "+",
                  allTags.length - 3
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowTagManager(true),
            className: "rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors",
            title: "标签管理",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowFilterMenu(!showFilterMenu),
              className: `flex items-center space-x-2 rounded-lg border px-3 py-2 text-sm transition-colors ${filterStatus !== "all" ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400" : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "筛选" }),
                filterStatus !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white", children: filterStatus === "unread" ? "未读" : filterStatus === "reading" ? "阅读中" : filterStatus === "finished" ? "已完成" : "" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${showFilterMenu ? "rotate-180" : ""}` })
              ]
            }
          ),
          showFilterMenu && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-full mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 space-y-1", children: [
            { value: "all", label: "全部书籍" },
            { value: "unread", label: "未开始" },
            { value: "reading", label: "阅读中" },
            { value: "finished", label: "已完成" }
          ].map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setFilterStatus(option.value);
                setShowFilterMenu(false);
              },
              className: `w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filterStatus === option.value ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`,
              children: option.label
            },
            option.value
          )) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowSortMenu(!showSortMenu),
              className: "flex items-center space-x-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpDown, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "排序" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${showSortMenu ? "rotate-180" : ""}` })
              ]
            }
          ),
          showSortMenu && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 space-y-1", children: [
            { value: "addedAt", label: "添加时间" },
            { value: "title", label: "书名" },
            { value: "author", label: "作者" },
            { value: "lastReadAt", label: "最后阅读" },
            { value: "progress", label: "阅读进度" }
          ].map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                if (sortBy === option.value) {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy(option.value);
                  setSortOrder("desc");
                }
              },
              className: `w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${sortBy === option.value ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: option.label }),
                sortBy === option.value && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: sortOrder === "asc" ? "↑" : "↓" })
              ]
            },
            option.value
          )) }) }),
          showBatchActionMenu && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setShowBatchActionMenu(false);
                  setShowCollectionManager(true);
                },
                className: "w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FolderCollection, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "添加到书架" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setShowBatchActionMenu(false);
                  setShowTagManager(true);
                },
                className: "w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "添加标签" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setShowBatchActionMenu(false);
                  handleBatchDelete();
                },
                className: "w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "删除选中书籍" })
                ]
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => importMutation.mutate(),
            disabled: importMutation.isPending,
            className: "flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: importMutation.isPending ? "导入中..." : "导入书籍" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(BookCardSkeleton, { count: 12, viewMode }) : filteredAndSortedBooks.length === 0 && books.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mx-auto h-24 w-24 text-gray-300" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300", children: "未找到匹配的书籍" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 text-sm text-gray-500 dark:text-gray-400", children: "尝试使用不同的关键词搜索" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setSearchQuery(""),
          className: "inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "清除搜索" })
          ]
        }
      )
    ] }) }) : books.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "mx-auto h-24 w-24 text-gray-300" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300", children: "还没有书籍" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 text-sm text-gray-500 dark:text-gray-400", children: '点击上方"导入书籍"按钮，选择 EPUB 文件导入' }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => importMutation.mutate(),
          disabled: importMutation.isPending,
          className: "inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "导入第一本书" })
          ]
        }
      )
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      viewMode === "grid" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6", children: filteredAndSortedBooks.map((book) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => !isBatchMode && handleOpenBook(book.id),
          className: `group relative cursor-pointer ${isBatchMode ? "cursor-default" : ""}`,
          children: [
            isBatchMode && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  toggleBookSelection(book.id);
                },
                className: "absolute top-2 left-2 z-10 rounded-full bg-white/90 p-2 shadow-md hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 transition-colors",
                children: selectedBookIds.has(book.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "h-5 w-5 text-blue-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-5 w-5 text-gray-400" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative mb-3 aspect-[2/3] overflow-hidden rounded-lg shadow-md transition-all ${isBatchMode ? "" : "group-hover:shadow-xl"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: getCoverUrl(book),
                  alt: book.title,
                  className: "h-full w-full object-cover transition-transform group-hover:scale-105",
                  onError: (e) => {
                    const target = e.target;
                    target.src = "data:image/svg+xml," + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
                          <rect fill="#e5e7eb" width="200" height="300"/>
                          <text x="100" y="150" font-family="sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">${book.title.charAt(0)}</text>
                        </svg>
                      `);
                  }
                }
              ),
              book.progress > 0 && book.progress < 100 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-blue-600/80 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 overflow-hidden rounded-full bg-blue-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-white",
                  style: { width: `${book.progress}%` }
                }
              ) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => handleViewDetails(book.id, e),
                    className: "rounded-full bg-white/90 p-3 text-gray-700 hover:bg-white transition-colors",
                    title: "查看详情",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-6 w-6" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-12 w-12 text-white" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 text-sm font-medium text-gray-900 dark:text-white", children: book.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 line-clamp-1", children: book.author }),
              book.tags && book.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1", children: [
                book.tags.slice(0, 2).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "px-1.5 py-0.5 rounded text-xs",
                    style: {
                      backgroundColor: tag.color + "30",
                      color: tag.color
                    },
                    children: tag.name
                  },
                  tag.id
                )),
                book.tags.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                  "+",
                  book.tags.length - 2
                ] })
              ] }),
              book.lastReadAt && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500", children: book.progress > 0 ? `已读 ${book.progress.toFixed(0)}%` : "未开始" })
            ] })
          ]
        },
        book.id
      )) }),
      viewMode === "list" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: filteredAndSortedBooks.map((book) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => !isBatchMode && handleOpenBook(book.id),
          className: `group flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-all ${isBatchMode ? "cursor-default" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md"}`,
          children: [
            isBatchMode && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  toggleBookSelection(book.id);
                },
                className: "flex-shrink-0",
                children: selectedBookIds.has(book.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckSquare, { className: "h-5 w-5 text-blue-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-5 w-5 text-gray-400" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: getCoverUrl(book),
                alt: book.title,
                className: "h-full w-full object-cover",
                onError: (e) => {
                  const target = e.target;
                  target.src = "data:image/svg+xml," + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 48 64">
                              <rect fill="#e5e7eb" width="48" height="64"/>
                              <text x="24" y="32" font-family="sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">{book.title.charAt(0)}</text>
                            </svg>
                          `);
                }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-semibold text-gray-900 dark:text-white line-clamp-1", children: book.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 line-clamp-1", children: book.author }),
              book.tags && book.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap gap-1.5", children: [
                book.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "px-2 py-0.5 rounded-full text-xs font-medium",
                    style: {
                      backgroundColor: tag.color + "30",
                      color: tag.color
                    },
                    children: tag.name
                  },
                  tag.id
                )),
                book.tags.length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                  "+",
                  book.tags.length - 3
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500", children: [
                book.lastReadAt && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: book.progress > 0 ? `已读 ${book.progress.toFixed(0)}%` : "未开始" }),
                book.addedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "添加于 ",
                  new Date(book.addedAt).toLocaleDateString("zh-CN")
                ] })
              ] }),
              book.progress > 0 && book.progress < 100 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full bg-blue-600",
                  style: { width: `${book.progress}%` }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => handleViewDetails(book.id, e),
                  className: "rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity",
                  title: "查看详情",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity", children: "阅读" })
            ] })
          ]
        },
        book.id
      )) })
    ] }) }),
    showTagManager && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "标签管理" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowTagManager(false),
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: isBatchMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
          "为选中的 ",
          selectedBookIds.size,
          " 本书籍添加标签"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TagManager, { onClose: () => setShowTagManager(false) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TagManager, { onClose: () => setShowTagManager(false) }) })
    ] }) }),
    showCollectionManager && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: isBatchMode ? `添加 ${selectedBookIds.size} 本书到书架` : "书架管理" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowCollectionManager(false),
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionManager, { onClose: () => setShowCollectionManager(false) }) })
    ] }) })
  ] });
}
export {
  Library,
  Library as default
};
