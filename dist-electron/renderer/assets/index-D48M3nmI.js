import { a as useNavigate, u as useQueryClient, r as reactExports, j as jsxRuntimeExports, q as ArrowLeft, c as Search, X, V as Volume2, E as Edit, T as Trash2, B as BookOpen, t as toast, m as modal } from "./index-RTiwXa8_.js";
import { u as useElectronAPI, a as useQuery, b as useMutation } from "./useElectronAPI-Xat-dAEw.js";
function WordBook() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedLanguage, setSelectedLanguage] = reactExports.useState("all");
  const [editingEntry, setEditingEntry] = reactExports.useState(null);
  const { data: stats } = useQuery({
    queryKey: ["wordbook", "stats"],
    queryFn: () => api.wordbook.getStats()
  });
  const { data: words = [], isLoading } = useQuery({
    queryKey: ["wordbook", "all", selectedLanguage],
    queryFn: async () => {
      if (searchQuery.trim()) {
        return await api.wordbook.search(searchQuery, {
          language: selectedLanguage === "all" ? void 0 : selectedLanguage
        });
      }
      return await api.wordbook.getAll({
        language: selectedLanguage === "all" ? void 0 : selectedLanguage
      });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.wordbook.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      toast.success("已删除");
    },
    onError: () => {
      toast.error("删除失败");
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await api.wordbook.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbook"] });
      toast.success("已更新");
      setEditingEntry(null);
    },
    onError: () => {
      toast.error("更新失败");
    }
  });
  const handleDelete = async (entry) => {
    const confirmed = await modal.confirm({
      title: "删除生词",
      content: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2", children: [
        '确定要删除生词 "',
        entry.word,
        '" 吗？'
      ] }) })
    });
    if (confirmed) {
      deleteMutation.mutate(entry.id);
    }
  };
  const handleSpeak = (word, language) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = language === "zh" ? "zh-CN" : "en-US";
      speechSynthesis.speak(utterance);
    } else {
      toast.error("您的浏览器不支持语音朗读");
    }
  };
  const getLanguageLabel = (lang) => {
    const labels = {
      en: "英语",
      zh: "中文",
      ja: "日语",
      ko: "韩语",
      fr: "法语",
      de: "德语",
      es: "西班牙语"
    };
    return labels[lang] || lang;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate(-1),
            className: "rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "生词本" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-6 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "总词汇量：" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: stats?.totalCount || 0 })
        ] }),
        stats?.byLanguage && Object.keys(stats.byLanguage).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center space-x-3", children: Object.entries(stats.byLanguage).map(([lang, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium dark:bg-blue-900/20 dark:text-blue-400",
            children: [
              getLanguageLabel(lang),
              ": ",
              count
            ]
          },
          lang
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: "搜索生词...",
            className: "w-full pl-10 pr-8 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 ml-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "语言：" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: selectedLanguage,
            onChange: (e) => setSelectedLanguage(e.target.value),
            className: "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "全部" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "英语" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "zh", children: "中文" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ja", children: "日语" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" }) }) : words.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 dark:text-gray-500", children: searchQuery ? "没有找到匹配的生词" : "生词本是空的，在阅读时选择文本即可添加" }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: words.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-1", children: entry.word }),
              entry.language && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400", children: getLanguageLabel(entry.language) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleSpeak(entry.word, entry.language),
                  className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
                  title: "朗读",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setEditingEntry(entry),
                  className: "rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-colors",
                  title: "编辑",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Edit, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => handleDelete(entry),
                  className: "rounded p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors",
                  title: "删除",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }),
          entry.translation && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: "翻译" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: entry.translation })
          ] }),
          entry.definition && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: "释义" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: entry.definition })
          ] }),
          entry.context && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-1", children: "上下文" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 line-clamp-2", children: entry.context })
          ] }),
          entry.bookId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center text-xs text-gray-400 dark:text-gray-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3 w-3 mr-1" }),
            "来自书籍"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-2", children: entry.createdAt && new Date(entry.createdAt).toLocaleDateString("zh-CN") })
        ]
      },
      entry.id
    )) }) }),
    editingEntry && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "编辑生词" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setEditingEntry(null),
            className: "rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "单词" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: editingEntry.word,
              disabled: true,
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "翻译" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: editingEntry.translation,
              onChange: (e) => setEditingEntry({ ...editingEntry, translation: e.target.value }),
              rows: 2,
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "释义" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: editingEntry.definition,
              onChange: (e) => setEditingEntry({ ...editingEntry, definition: e.target.value }),
              rows: 3,
              className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end space-x-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setEditingEntry(null),
              className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => updateMutation.mutate({
                id: editingEntry.id,
                updates: {
                  translation: editingEntry.translation,
                  definition: editingEntry.definition
                }
              }),
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
  WordBook,
  WordBook as default
};
