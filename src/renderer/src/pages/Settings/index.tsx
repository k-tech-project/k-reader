/**
 * 设置页面
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Type, Palette, Keyboard, Save, Bookmark, Cpu, Sparkles } from '../../utils/icons';
import { PRESET_THEMES, PAGE_ANIMATIONS, type ReaderTheme, type PageAnimationType } from '../../modules/reader/types/reader.types';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { toast } from '../../components/Toast';

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

// AI设置接口
interface AISettings {
  enabled: boolean;
  provider: 'openai' | 'claude' | 'zhipu' | 'qianwen' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const defaultAISettings: AISettings = {
  enabled: false,
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
};

// AI提供商配置
const AI_PROVIDERS: Record<
  AISettings['provider'],
  {
    name: string;
    description: string;
    models: string[];
    defaultModel: string;
    needsBaseURL: boolean;
    defaultBaseURL?: string;
    needsCustomModelName?: boolean;
  }
> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4、GPT-4o 等模型',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    needsBaseURL: false,
  },
  claude: {
    name: 'Claude (Anthropic)',
    description: 'Claude 3.5 Sonnet、Opus 等模型',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    needsBaseURL: false,
  },
  zhipu: {
    name: '智谱AI (GLM-4)',
    description: '国产大模型，兼容OpenAI接口',
    models: ['glm-4.7', 'glm-4-flash', 'glm-3-turbo'],
    defaultModel: 'glm-4.7',
    needsBaseURL: true,
    defaultBaseURL: 'https://open.bigmodel.cn/api/coding/paas/v4',
  },
  qianwen: {
    name: '通义千问',
    description: '阿里云大模型，兼容OpenAI接口',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    defaultModel: 'qwen-turbo',
    needsBaseURL: true,
    defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  custom: {
    name: '自定义模型',
    description: '配置兼容 OpenAI API 的自定义端点',
    models: [], // 空数组，使用自定义输入
    defaultModel: '',
    needsBaseURL: true,
    needsCustomModelName: true,
  },
};

export function Settings() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [testingAI, setTestingAI] = useState(false);

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

    // 加载AI设置
    loadAISettings();
  }, []);

  const loadAISettings = async () => {
    try {
      const savedAI = await api.settings.get('ai');
      if (savedAI) {
        setAISettings(savedAI);
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  // 保存设置
  const handleSave = async () => {
    localStorage.setItem('app:settings', JSON.stringify(settings));

    // 保存AI设置
    try {
      await api.settings.set('ai', aiSettings);
      toast.success('设置已保存');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error('AI设置保存失败');
    }

    setHasChanges(false);
  };

  // 重置设置
  const handleReset = () => {
    setSettings(defaultSettings);
    setAISettings(defaultAISettings);
    setHasChanges(true);
  };

  // 更新设置
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // 更新AI设置
  const updateAISetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setAISettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // 测试AI配置
  const handleTestAI = async () => {
    if (!aiSettings.apiKey) {
      toast.warning('请先输入 API Key');
      return;
    }

    setTestingAI(true);
    try {
      // 临时保存配置进行测试
      await api.settings.set('ai', aiSettings);
      const result = await api.ai.checkConfig();

      if (result.valid) {
        toast.success('AI 配置验证成功！');
      } else {
        toast.error(`配置验证失败: ${result.error}`);
      }
    } catch (error) {
      console.error('AI config test failed:', error);
      toast.error('配置验证失败，请检查设置');
    } finally {
      setTestingAI(false);
    }
  };

  // 切换提供商时更新默认配置
  const handleProviderChange = (provider: AISettings['provider']) => {
    const providerConfig = AI_PROVIDERS[provider];
    setAISettings((prev) => ({
      ...prev,
      provider,
      model: providerConfig.defaultModel,
      baseURL: providerConfig.needsBaseURL ? providerConfig.defaultBaseURL : '',
    }));
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

          {/* 生词本入口 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <Bookmark className="mr-2 h-5 w-5" />
              生词本
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              在阅读时选择文本可自动添加到生词本，支持翻译和语音朗读
            </p>

            <button
              onClick={() => navigate('/wordbook')}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              <span>打开生词本</span>
            </button>
          </section>

          {/* AI 设置 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <Sparkles className="mr-2 h-5 w-5" />
              AI 功能设置
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              配置 AI 模型用于章节总结功能。支持 OpenAI、Claude、智谱AI、通义千问等。
            </p>

            <div className="space-y-6">
              {/* 启用AI */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">启用 AI 功能</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">开启后可使用AI章节总结</p>
                </div>
                <button
                  onClick={() => updateAISetting('enabled', !aiSettings.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {aiSettings.enabled && (
                <>
                  {/* AI提供商选择 */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI 提供商
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.entries(AI_PROVIDERS) as [AISettings['provider'], typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS]][]).map(([key, provider]) => (
                        <button
                          key={key}
                          onClick={() => handleProviderChange(key)}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            aiSettings.provider === key
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{provider.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{provider.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={aiSettings.apiKey}
                      onChange={(e) => updateAISetting('apiKey', e.target.value)}
                      placeholder="输入你的 API Key"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {aiSettings.provider === 'claude' && '在 Anthropic 控制台获取: console.anthropic.com'}
                      {aiSettings.provider === 'openai' && '在 OpenAI 控制台获取: platform.openai.com'}
                      {aiSettings.provider === 'zhipu' && '在智谱AI开放平台获取: open.bigmodel.cn'}
                      {aiSettings.provider === 'qianwen' && '在阿里云百炼平台获取: dashscope.aliyuncs.com'}
                      {aiSettings.provider === 'custom' && '输入你的自定义 API 密钥'}
                    </p>
                  </div>

                  {/* 自定义 API 端点 */}
                  {AI_PROVIDERS[aiSettings.provider].needsBaseURL && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        API 端点 (Base URL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aiSettings.baseURL || ''}
                        onChange={(e) => updateAISetting('baseURL', e.target.value)}
                        placeholder="https://api.example.com/v1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        使用自定义 API 端点或代理
                      </p>
                    </div>
                  )}

                  {/* 模型选择 */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      模型
                    </label>
                    {AI_PROVIDERS[aiSettings.provider].needsCustomModelName ? (
                      <input
                        type="text"
                        value={aiSettings.model}
                        onChange={(e) => updateAISetting('model', e.target.value)}
                        placeholder="输入模型名称，如 gpt-3.5-turbo"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <select
                        value={aiSettings.model}
                        onChange={(e) => updateAISetting('model', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {AI_PROVIDERS[aiSettings.provider].models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Temperature: {aiSettings.temperature}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => updateAISetting('temperature', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="min-w-[3rem] text-center text-sm text-gray-900 dark:text-white">
                        {aiSettings.temperature}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      控制输出随机性。值越低输出越确定，值越高输出越随机
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      最大 Tokens: {aiSettings.maxTokens}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="100"
                        max="4000"
                        step="100"
                        value={aiSettings.maxTokens}
                        onChange={(e) => updateAISetting('maxTokens', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="min-w-[4rem] text-center text-sm text-gray-900 dark:text-white">
                        {aiSettings.maxTokens}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      控制单次生成的最大长度
                    </p>
                  </div>

                  {/* 测试按钮 */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleTestAI}
                      disabled={testingAI || !aiSettings.apiKey}
                      className="inline-flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Cpu className={`h-4 w-4 ${testingAI ? 'animate-spin' : ''}`} />
                      <span>{testingAI ? '验证中...' : '验证配置'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
