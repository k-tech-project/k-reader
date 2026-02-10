import { a as useNavigate, r as reactExports, j as jsxRuntimeExports, q as ArrowLeft, R as Save, B as BookOpen, U as Keyboard, s as Bookmark } from "./index-RTiwXa8_.js";
import { P as PRESET_THEMES, a as PAGE_ANIMATIONS } from "./reader.types-B75wmYyt.js";
const defaultSettings = {
  defaultFontSize: 16,
  defaultTheme: "light",
  defaultPageAnimation: "fade",
  autoSaveProgress: true,
  autoSaveInterval: 10,
  libraryViewMode: "grid",
  showReadProgress: true
};
function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = reactExports.useState(defaultSettings);
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const savedSettings = localStorage.getItem("app:settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
  }, []);
  const handleSave = () => {
    localStorage.setItem("app:settings", JSON.stringify(settings));
    setHasChanges(false);
  };
  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/library"),
            className: "rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700",
            title: "返回",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "设置" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "配置应用偏好" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleReset,
            className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            children: "重置默认"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleSave,
            disabled: !hasChanges,
            className: "flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "保存设置" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "mr-2 h-5 w-5" }),
          "阅读器默认设置"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "默认字体大小" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 12,
                  max: 32,
                  step: 2,
                  value: settings.defaultFontSize,
                  onChange: (e) => updateSetting("defaultFontSize", parseInt(e.target.value)),
                  className: "flex-1"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-[3rem] text-center text-sm text-gray-900 dark:text-white", children: [
                settings.defaultFontSize,
                "px"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "默认主题" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: Object.values(PRESET_THEMES).map((theme) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => updateSetting("defaultTheme", theme.id),
                className: `rounded-lg border p-3 text-sm font-medium transition-all ${settings.defaultTheme === theme.id ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                style: {
                  backgroundColor: theme.id === "light" ? void 0 : theme.background,
                  color: theme.id === "light" ? void 0 : theme.color
                },
                children: theme.name
              },
              theme.id
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "翻页动画" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.entries(PAGE_ANIMATIONS).map(([key, { name, description }]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => updateSetting("defaultPageAnimation", key),
                className: `rounded-lg border p-3 text-left transition-all ${settings.defaultPageAnimation === key ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                title: description,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs opacity-70", children: description })
                ]
              },
              key
            )) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-5 w-5" }),
          "自动保存"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "自动保存阅读进度" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "翻页时自动保存阅读位置" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => updateSetting("autoSaveProgress", !settings.autoSaveProgress),
                className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoSaveProgress ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoSaveProgress ? "translate-x-6" : "translate-x-1"}`
                  }
                )
              }
            )
          ] }),
          settings.autoSaveProgress && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "保存间隔（秒）" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 5,
                max: 60,
                step: 5,
                value: settings.autoSaveInterval,
                onChange: (e) => updateSetting("autoSaveInterval", parseInt(e.target.value) || 10),
                className: "w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "mr-2 h-5 w-5" }),
          "书库设置"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "默认视图模式" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => updateSetting("libraryViewMode", "grid"),
                  className: `flex-1 rounded-lg border p-3 text-center transition-all ${settings.libraryViewMode === "grid" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded bg-current" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded bg-current" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2 rounded bg-current" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs", children: "网格" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => updateSetting("libraryViewMode", "list"),
                  className: `flex-1 rounded-lg border p-3 text-center transition-all ${settings.libraryViewMode === "list" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full rounded bg-current opacity-70" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-2/3 rounded bg-current opacity-70" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs", children: "列表" })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "显示阅读进度" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "在书籍封面上显示进度百分比" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => updateSetting("showReadProgress", !settings.showReadProgress),
                className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.showReadProgress ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showReadProgress ? "translate-x-6" : "translate-x-1"}`
                  }
                )
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Keyboard, { className: "mr-2 h-5 w-5" }),
          "快捷键"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "翻页" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "← / →" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "目录" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "T" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "添加书签" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "B" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "设置" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "S" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "搜索" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "Ctrl+F" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "全屏" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "F11" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "字号 +" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "+" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "字号 -" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "-" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "返回" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-gray-900 dark:text-white", children: "Esc" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "mr-2 h-5 w-5" }),
          "生词本"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: "在阅读时选择文本可自动添加到生词本，支持翻译和语音朗读" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => navigate("/wordbook"),
            className: "inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "打开生词本" })
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  Settings,
  Settings as default
};
