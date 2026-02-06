/**
 * 设置页面
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Type, Palette, Keyboard, Save } from '../../utils/icons';
import { PRESET_THEMES, PAGE_ANIMATIONS, type ReaderTheme, type PageAnimationType } from '../../modules/reader/types/reader.types';

// 设置接口
interface AppSettings {
  // 阅读器默认设置
  defaultFontSize: number;
  defaultTheme: string;
  defaultPageAnimation: PageAnimationType;
  // 自动保存
  autoSaveProgress: boolean;
  autoSaveInterval: number;
  // 书库设置
  libraryViewMode: 'grid' | 'list';
  showReadProgress: boolean;
}

// 默认设置
const defaultSettings: AppSettings = {
  defaultFontSize: 16,
  defaultTheme: 'light',
  defaultPageAnimation: 'fade',
  autoSaveProgress: true,
  autoSaveInterval: 10,
  libraryViewMode: 'grid',
  showReadProgress: true,
};

export function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('app:settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
  }, []);

  // 保存设置
  const handleSave = () => {
    localStorage.setItem('app:settings', JSON.stringify(settings));
    setHasChanges(false);
    // TODO: 显示保存成功提示
  };

  // 重置设置
  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  // 更新设置
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/library')}
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">设置</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">配置应用偏好</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            重置默认
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>保存设置</span>
          </button>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* 阅读器设置 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <BookOpen className="mr-2 h-5 w-5" />
              阅读器默认设置
            </h2>

            <div className="space-y-6">
              {/* 默认字体大小 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  默认字体大小
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min={12}
                    max={32}
                    step={2}
                    value={settings.defaultFontSize}
                    onChange={(e) => updateSetting('defaultFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[3rem] text-center text-sm text-gray-900 dark:text-white">
                    {settings.defaultFontSize}px
                  </span>
                </div>
              </div>

              {/* 默认主题 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  默认主题
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(PRESET_THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => updateSetting('defaultTheme', theme.id)}
                      className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                        settings.defaultTheme === theme.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: theme.id === 'light' ? undefined : theme.background,
                        color: theme.id === 'light' ? undefined : theme.color,
                      }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 翻页动画 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  翻页动画
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PAGE_ANIMATIONS).map(([key, { name, description }]) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('defaultPageAnimation', key as PageAnimationType)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        settings.defaultPageAnimation === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      title={description}
                    >
                      <div className="font-medium">{name}</div>
                      <div className="text-xs opacity-70">{description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 自动保存设置 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <Save className="mr-2 h-5 w-5" />
              自动保存
            </h2>

            <div className="space-y-4">
              {/* 自动保存进度 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">自动保存阅读进度</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">翻页时自动保存阅读位置</p>
                </div>
                <button
                  onClick={() => updateSetting('autoSaveProgress', !settings.autoSaveProgress)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoSaveProgress ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSaveProgress ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 保存间隔 */}
              {settings.autoSaveProgress && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    保存间隔（秒）
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    step={5}
                    value={settings.autoSaveInterval}
                    onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 10)}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 书库设置 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <BookOpen className="mr-2 h-5 w-5" />
              书库设置
            </h2>

            <div className="space-y-4">
              {/* 视图模式 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  默认视图模式
                </label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateSetting('libraryViewMode', 'grid')}
                    className={`flex-1 rounded-lg border p-3 text-center transition-all ${
                      settings.libraryViewMode === 'grid'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-2 w-2 rounded bg-current" />
                      <div className="h-2 w-2 rounded bg-current" />
                      <div className="h-2 w-2 rounded bg-current" />
                    </div>
                    <div className="mt-1 text-xs">网格</div>
                  </button>
                  <button
                    onClick={() => updateSetting('libraryViewMode', 'list')}
                    className={`flex-1 rounded-lg border p-3 text-center transition-all ${
                      settings.libraryViewMode === 'list'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded bg-current opacity-70" />
                      <div className="h-2 w-2/3 rounded bg-current opacity-70" />
                    </div>
                    <div className="mt-1 text-xs">列表</div>
                  </button>
                </div>
              </div>

              {/* 显示阅读进度 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">显示阅读进度</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">在书籍封面上显示进度百分比</p>
                </div>
                <button
                  onClick={() => updateSetting('showReadProgress', !settings.showReadProgress)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showReadProgress ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showReadProgress ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* 快捷键说明 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <Keyboard className="mr-2 h-5 w-5" />
              快捷键
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">翻页</span>
                <span className="font-mono text-gray-900 dark:text-white">← / →</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">目录</span>
                <span className="font-mono text-gray-900 dark:text-white">T</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">添加书签</span>
                <span className="font-mono text-gray-900 dark:text-white">B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">设置</span>
                <span className="font-mono text-gray-900 dark:text-white">S</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">搜索</span>
                <span className="font-mono text-gray-900 dark:text-white">Ctrl+F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">全屏</span>
                <span className="font-mono text-gray-900 dark:text-white">F11</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">字号 +</span>
                <span className="font-mono text-gray-900 dark:text-white">+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">字号 -</span>
                <span className="font-mono text-gray-900 dark:text-white">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">返回</span>
                <span className="font-mono text-gray-900 dark:text-white">Esc</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
