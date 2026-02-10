import { p as useParams, a as useNavigate, u as useQueryClient, r as reactExports, j as jsxRuntimeExports, H as Book, J as FileText, K as Calendar, N as Clock, O as Highlight, s as Bookmark, q as ArrowLeft, E as Edit, Q as Share, T as Trash2, R as Save, B as BookOpen, d as Tag, X, t as toast, m as modal } from "./index-RTiwXa8_.js";
import { u as useElectronAPI, a as useQuery, b as useMutation } from "./useElectronAPI-Xat-dAEw.js";
import { T as TagManager } from "./index-B8fUaEoU.js";
function BookDetail() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [coverUrl, setCoverUrl] = reactExports.useState("");
  const [coverLoaded, setCoverLoaded] = reactExports.useState(false);
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [editedBook, setEditedBook] = reactExports.useState({});
  const [showTagManager, setShowTagManager] = reactExports.useState(false);
  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID is required");
      return await api.book.get(bookId);
    },
    enabled: !!bookId
  });
  const { data: highlights = [] } = useQuery({
    queryKey: ["highlights-count", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: "highlight" });
    },
    enabled: !!bookId
  });
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks-count", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: "bookmark" });
    },
    enabled: !!bookId
  });
  const { data: bookTags = [], refetch: refetchTags } = useQuery({
    queryKey: ["bookTags", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.tag.getByBook(bookId);
    },
    enabled: !!bookId
  });
  reactExports.useEffect(() => {
    const loadCover = async () => {
      if (!book?.coverUrl) return;
      try {
        const buffer = await api.file.read(book.coverUrl);
        const blob = new Blob([buffer], { type: "image/jpeg" });
        const blobUrl = URL.createObjectURL(blob);
        setCoverUrl(blobUrl);
        setCoverLoaded(true);
      } catch (error) {
        console.error("Failed to load cover:", error);
        setCoverLoaded(false);
      }
    };
    loadCover();
    return () => {
      if (coverUrl && coverUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverUrl);
      }
    };
  }, [book?.coverUrl]);
  const handleBack = () => {
    navigate("/library");
  };
  const handleRead = () => {
    if (bookId) {
      navigate(`/reader/${bookId}`);
    }
  };
  useMutation({
    mutationFn: async () => {
      if (!bookId) return;
      await api.book.delete(bookId);
    },
    onSuccess: () => {
      toast.success("书籍已删除");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      navigate("/library");
    },
    onError: (error) => {
      console.error("Failed to delete book:", error);
      toast.error("删除书籍失败");
    }
  });
  const handleDelete = () => {
    modal.confirm({
      title: "确认删除",
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-sm text-gray-600 dark:text-gray-400", children: "确定要删除这本书吗？" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-500", children: "删除后，所有阅读进度和批注都将被删除，此操作无法撤销。" })
      ] })
    });
  };
  const handleExport = async () => {
    try {
      modal.custom({
        title: "导出批注",
        size: "sm",
        content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "选择导出格式" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: async () => {
                  modal.close();
                  await exportAnnotations("markdown");
                },
                className: "flex items-center space-x-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Markdown" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "适用于笔记软件和文档编辑" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: async () => {
                  modal.close();
                  await exportAnnotations("json");
                },
                className: "flex items-center space-x-3 rounded-lg border border-gray-300 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "JSON" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "数据格式，便于程序处理" })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => modal.close(),
              className: "w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
              children: "取消"
            }
          )
        ] }),
        showFooter: false
      });
    } catch (error) {
      console.error("Failed to open export dialog:", error);
    }
  };
  const handleShare = async () => {
    toast.info("分享功能即将推出");
  };
  const exportAnnotations = async (format) => {
    if (!bookId) return;
    try {
      const result = await api.annotation.export({ bookId, format });
      if (!result.success || !result.data) {
        toast.error(result.error || "导出失败");
        return;
      }
      const defaultFileName = `${book?.title || "annotations"}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.${format === "markdown" ? "md" : "json"}`;
      const savePath = await api.file.select({
        title: "保存批注文件",
        defaultPath: defaultFileName,
        filters: [
          {
            name: format === "markdown" ? "Markdown" : "JSON",
            extensions: [format === "markdown" ? "md" : "json"]
          }
        ],
        properties: ["saveFile"]
      });
      if (savePath.length === 0) {
        return;
      }
      await api.file.write(savePath[0], result.data);
      toast.success(`批注已导出到 ${savePath[0]}`);
    } catch (error) {
      console.error("Failed to export annotations:", error);
      toast.error("导出批注失败");
    }
  };
  const handleEdit = () => {
    if (!book) return;
    setEditedBook({
      title: book.title,
      author: book.author,
      description: book.description
    });
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedBook({});
  };
  const handleSaveEdit = async () => {
    if (!book || !bookId) return;
    try {
      await api.book.update(bookId, editedBook);
      toast.success("书籍信息已更新");
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsEditing(false);
      setEditedBook({});
    } catch (error) {
      console.error("Failed to update book:", error);
      toast.error("更新书籍信息失败");
    }
  };
  const getCoverUrl = () => {
    if (coverUrl && coverLoaded) {
      return coverUrl;
    }
    if (book) {
      return "data:image/svg+xml," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
          <rect fill="#e5e7eb" width="400" height="600"/>
          <text x="200" y="300" font-family="sans-serif" font-size="32" fill="#9ca3af" text-anchor="middle">{book.title.charAt(0)}</text>
        </svg>
      `);
    }
    return "";
  };
  const formatFileSize = (bytes) => {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "未知";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "正在加载..." })
    ] }) });
  }
  if (!book) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Book, { className: "mx-auto h-16 w-16 text-gray-300 mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-700 dark:text-gray-300", children: "书籍不存在" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleBack,
          className: "mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
          children: "返回书库"
        }
      )
    ] }) });
  }
  const stats = [
    { label: "总页数", value: `${book.totalPages || "未知"} 页`, icon: FileText },
    { label: "添加时间", value: formatDate(book.addedAt), icon: Calendar },
    { label: "最后阅读", value: book.lastReadAt ? formatDate(book.lastReadAt) : "未开始", icon: Clock },
    { label: "高亮批注", value: `${highlights.length} 条`, icon: Highlight },
    { label: "书签", value: `${bookmarks.length} 个`, icon: Bookmark }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleBack,
            className: "rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700",
            title: "返回",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-gray-900 dark:text-white line-clamp-1", children: "书籍详情" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        !isEditing && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleEdit,
            className: "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
            title: "编辑书籍信息",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Edit, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleShare,
            className: "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
            title: "分享",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleExport,
            className: "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
            title: "导出",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleDelete,
            className: "rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors",
            title: "删除书籍",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:w-48 md:h-64 md:flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64 md:h-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: getCoverUrl(),
              alt: book.title,
              className: "w-full h-full object-contain"
            }
          ) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-6", children: isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "书名" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: editedBook.title || "",
                  onChange: (e) => setEditedBook({ ...editedBook, title: e.target.value }),
                  className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "作者" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: editedBook.author || "",
                  onChange: (e) => setEditedBook({ ...editedBook, author: e.target.value }),
                  className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "简介" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: editedBook.description || "",
                  onChange: (e) => setEditedBook({ ...editedBook, description: e.target.value }),
                  rows: 3,
                  className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: handleSaveEdit,
                  className: "flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
                    "保存"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleCancelEdit,
                  className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
                  children: "取消"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1", children: book.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-600 dark:text-gray-400 mb-4", children: book.author }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "h-full bg-blue-600",
                    style: { width: `${book.progress || 0}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: book.progress ? `${book.progress.toFixed(0)}%` : "0%" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "阅读进度" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: handleRead,
                className: "w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "mr-2 h-5 w-5" }),
                  "继续阅读"
                ]
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-200 px-6 py-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white mb-4", children: "详细信息" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: stats.map((stat, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(stat.icon, { className: "h-4 w-4 text-gray-500 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400", children: stat.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: stat.value })
            ] })
          ] }, index)) })
        ] })
      ] }),
      book.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-3", children: "简介" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 whitespace-pre-wrap", children: book.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "标签" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowTagManager(true),
              className: "flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "管理标签" })
              ]
            }
          )
        ] }),
        bookTags.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: bookTags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
            style: {
              backgroundColor: tag.color + "30",
              color: tag.color
            },
            children: tag.name
          },
          tag.id
        )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: "暂无标签" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "元数据" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid grid-cols-2 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "文件名" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-gray-900 dark:text-white font-medium", children: book.fileName || "-" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "文件大小" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-gray-900 dark:text-white font-medium", children: formatFileSize(book.fileSize) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "创建时间" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-gray-900 dark:text-white font-medium", children: formatDate(book.createdAt) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "格式" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-gray-900 dark:text-white font-medium", children: book.format || "EPUB" })
          ] })
        ] })
      ] }),
      (highlights.length > 0 || bookmarks.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "我的批注" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Highlight, { className: "h-4 w-4 text-yellow-600 dark:text-yellow-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: highlights.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "个高亮" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4 text-blue-600 dark:text-blue-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: bookmarks.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "个书签" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              navigate(`/reader/${bookId}`);
            },
            className: "mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
            children: "查看全部批注 →"
          }
        )
      ] })
    ] }) }),
    showTagManager && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800 mx-4 max-h-[80vh] overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "标签管理" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setShowTagManager(false);
              refetchTags();
            },
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TagManager,
        {
          bookId,
          onClose: () => {
            setShowTagManager(false);
            refetchTags();
          }
        }
      ) })
    ] }) })
  ] });
}
export {
  BookDetail,
  BookDetail as default
};
