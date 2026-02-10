import { u as useQueryClient, r as reactExports, t as toast, j as jsxRuntimeExports, X, P as Plus, E as Edit, T as Trash2, m as modal } from "./index-RTiwXa8_.js";
import { u as useElectronAPI, a as useQuery, b as useMutation } from "./useElectronAPI-Xat-dAEw.js";
const PRESET_COLORS = [
  "#3B82F6",
  // blue
  "#EF4444",
  // red
  "#10B981",
  // green
  "#F59E0B",
  // amber
  "#8B5CF6",
  // violet
  "#EC4899",
  // pink
  "#06B6D4",
  // cyan
  "#6366F1",
  // indigo
  "#84CC16",
  // lime
  "#F97316"
  // orange
];
function TagManager({ bookId, onClose }) {
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [editingTag, setEditingTag] = reactExports.useState(null);
  const [showCreateForm, setShowCreateForm] = reactExports.useState(false);
  const [newTagName, setNewTagName] = reactExports.useState("");
  const [newTagColor, setNewTagColor] = reactExports.useState(PRESET_COLORS[0]);
  const { data: allTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return await api.tag.getAll();
    }
  });
  const { data: bookTags = [], isLoading: isLoadingBookTags } = useQuery({
    queryKey: ["bookTags", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.tag.getByBook(bookId);
    },
    enabled: !!bookId
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      return await api.tag.create({
        name: newTagName,
        color: newTagColor
      });
    },
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success(`标签 "${tag.name}" 创建成功`);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setShowCreateForm(false);
    },
    onError: (error) => {
      console.error("Failed to create tag:", error);
      toast.error("创建标签失败");
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await api.tag.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("标签更新成功");
      setEditingTag(null);
    },
    onError: (error) => {
      console.error("Failed to update tag:", error);
      toast.error("更新标签失败");
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (tagId) => {
      return await api.tag.delete(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("标签删除成功");
    },
    onError: (error) => {
      console.error("Failed to delete tag:", error);
      toast.error("删除标签失败");
    }
  });
  const addToBookMutation = useMutation({
    mutationFn: async (tagId) => {
      if (!bookId) throw new Error("Book ID is required");
      return await api.tag.addToBook({ bookId, tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookTags", bookId] });
    },
    onError: (error) => {
      console.error("Failed to add tag to book:", error);
      toast.error("添加标签失败");
    }
  });
  const removeFromBookMutation = useMutation({
    mutationFn: async (tagId) => {
      if (!bookId) throw new Error("Book ID is required");
      return await api.tag.removeFromBook({ bookId, tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookTags", bookId] });
    },
    onError: (error) => {
      console.error("Failed to remove tag from book:", error);
      toast.error("移除标签失败");
    }
  });
  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("请输入标签名称");
      return;
    }
    createMutation.mutate();
  };
  const handleUpdateTag = () => {
    if (!editingTag) return;
    updateMutation.mutate({
      id: editingTag.id,
      updates: { name: editingTag.name, color: editingTag.color }
    });
  };
  const handleDeleteTag = async (tag) => {
    const confirmed = await modal.confirm({
      title: "删除标签",
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2", children: [
          '确定要删除标签 "',
          tag.name,
          '" 吗？'
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "删除后，该标签将从所有书籍中移除。" })
      ] })
    });
    if (confirmed) {
      deleteMutation.mutate(tag.id);
    }
  };
  const isTagAddedToBook = (tagId) => {
    return bookTags.some((t) => t.id === tagId);
  };
  if (isLoadingTags || isLoadingBookTags) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    showCreateForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "创建新标签" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setShowCreateForm(false);
              setNewTagName("");
              setNewTagColor(PRESET_COLORS[0]);
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
            value: newTagName,
            onChange: (e) => setNewTagName(e.target.value),
            placeholder: "标签名称",
            className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "选择颜色" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: PRESET_COLORS.map((color) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setNewTagColor(color),
              className: `h-8 w-8 rounded-full transition-transform hover:scale-110 ${newTagColor === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800" : ""}`,
              style: { backgroundColor: color },
              title: color
            },
            color
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleCreateTag,
            disabled: createMutation.isPending || !newTagName.trim(),
            className: "w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            children: createMutation.isPending ? "创建中..." : "创建标签"
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "创建新标签" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: bookId ? "选择标签添加到书籍" : "所有标签" }),
      allTags.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-gray-400 dark:text-gray-500 py-4", children: "暂无标签，请创建新标签" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: allTags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "h-3 w-3 rounded-full",
                  style: { backgroundColor: tag.color }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: tag.name }),
              bookId && isTagAddedToBook(tag.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", children: "已添加" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center space-x-2", children: bookId ? (
              // 书籍标签管理模式
              isTagAddedToBook(tag.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => removeFromBookMutation.mutate(tag.id),
                  disabled: removeFromBookMutation.isPending,
                  className: "rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors",
                  title: "移除标签",
                  children: "移除"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => addToBookMutation.mutate(tag.id),
                  disabled: addToBookMutation.isPending,
                  className: "rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors",
                  title: "添加标签",
                  children: "添加"
                }
              )
            ) : (
              // 标签管理模式
              /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setEditingTag(tag),
                    className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
                    title: "编辑标签",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Edit, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => handleDeleteTag(tag),
                    className: "rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors",
                    title: "删除标签",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] })
            ) })
          ]
        },
        tag.id
      )) })
    ] }),
    editingTag && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "编辑标签" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setEditingTag(null),
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "标签名称" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: editingTag.name,
              onChange: (e) => setEditingTag({ ...editingTag, name: e.target.value }),
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "选择颜色" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: PRESET_COLORS.map((color) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setEditingTag({ ...editingTag, color }),
              className: `h-8 w-8 rounded-full transition-transform hover:scale-110 ${editingTag.color === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800" : ""}`,
              style: { backgroundColor: color },
              title: color
            },
            color
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end space-x-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setEditingTag(null),
              className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleUpdateTag,
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
export {
  TagManager as T
};
