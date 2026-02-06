# K-Reader 项目结构说明

## 目录结构

```
k-reader/
├── src/                           # 源代码目录
│   ├── main/                      # 主进程代码
│   │   ├── index.ts              # 主进程入口
│   │   ├── window/               # 窗口管理
│   │   │   └── WindowManager.ts  # 窗口管理器
│   │   ├── ipc/                  # IPC通信
│   │   │   ├── handlers.ts       # IPC处理器注册
│   │   │   └── handlers/         # 各模块IPC处理器
│   │   │       ├── window.ts     # 窗口处理器
│   │   │       ├── file.ts       # 文件处理器
│   │   │       ├── book.ts       # 书籍处理器
│   │   │       ├── annotation.ts # 批注处理器
│   │   │       ├── progress.ts   # 进度处理器
│   │   │       ├── tag.ts        # 标签处理器
│   │   │       ├── settings.ts   # 设置处理器
│   │   │       ├── database.ts   # 数据库处理器
│   │   │       └── system.ts     # 系统处理器
│   │   ├── database/             # 数据库
│   │   │   └── DatabaseService.ts # 数据库服务
│   │   └── services/             # 主进程服务
│   │
│   ├── preload/                  # Preload脚本
│   │   └── index.ts              # Preload入口(暴露API)
│   │
│   ├── renderer/                 # 渲染进程代码
│   │   ├── index.html            # HTML模板
│   │   └── src/
│   │       ├── main.tsx          # 渲染进程入口
│   │       ├── App.tsx           # 应用根组件
│   │       ├── index.css         # 全局样式
│   │       │
│   │       ├── pages/            # 页面组件
│   │       │   ├── Library/      # 书库页面
│   │       │   ├── Reader/       # 阅读器页面
│   │       │   └── Settings/     # 设置页面
│   │       │
│   │       ├── components/       # 通用组件
│   │       │   └── Layout/       # 布局组件
│   │       │
│   │       ├── modules/          # 功能模块
│   │       │   ├── reader/       # 阅读器模块
│   │       │   │   ├── components/
│   │       │   │   ├── hooks/
│   │       │   │   └── services/
│   │       │   ├── library/      # 书库模块
│   │       │   │   ├── components/
│   │       │   │   ├── hooks/
│   │       │   │   └── services/
│   │       │   ├── annotation/   # 批注模块
│   │       │   │   ├── components/
│   │       │   │   ├── hooks/
│   │       │   │   └── services/
│   │       │   ├── sync/         # 云同步模块
│   │       │   │   ├── components/
│   │       │   │   └── services/
│   │       │   ├── ai/           # AI助手模块
│   │       │   │   ├── components/
│   │       │   │   └── services/
│   │       │   ├── tts/          # TTS朗读模块
│   │       │   │   ├── components/
│   │       │   │   └── services/
│   │       │   └── translation/  # 翻译模块
│   │       │       ├── components/
│   │       │       └── services/
│   │       │
│   │       ├── store/            # 状态管理
│   │       │   ├── index.ts
│   │       │   ├── useUIStore.ts
│   │       │   ├── useBookStore.ts
│   │       │   ├── useReaderStore.ts
│   │       │   └── useSettingsStore.ts
│   │       │
│   │       ├── hooks/            # 自定义Hooks
│   │       │   └── useElectronAPI.ts
│   │       │
│   │       ├── utils/            # 工具函数
│   │       │   └── index.ts
│   │       │
│   │       └── types/            # 类型定义
│   │           └── index.ts
│   │
│   └── shared/                   # 主进程和渲染进程共享代码
│       ├── types/                # 共享类型定义
│       │   └── index.ts
│       └── constants/            # 共享常量
│           └── index.ts
│
├── resources/                     # 资源文件(图标等)
│
├── .vscode/                       # VSCode配置
│   ├── settings.json             # 编辑器设置
│   └── extensions.json           # 推荐扩展
│
├── electron.vite.config.ts        # Vite配置
├── tailwind.config.js             # TailwindCSS配置
├── postcss.config.js              # PostCSS配置
├── tsconfig.json                  # TypeScript配置
├── tsconfig.node.json             # Node环境TypeScript配置
├── .eslintrc.json                 # ESLint配置
├── .prettierrc.json               # Prettier配置
├── .gitignore                     # Git忽略文件
├── package.json                   # 项目配置
├── README.md                      # 项目说明
└── PROJECT_STRUCTURE.md           # 本文件
```

## 模块说明

### 主进程 (src/main)
负责管理应用生命周期、窗口、文件系统、数据库等原生功能。

- **window/**: 窗口管理,包括创建、最小化、最大化、关闭等操作
- **ipc/**: IPC通信处理,连接主进程和渲染进程
- **database/**: SQLite数据库服务,存储书籍、批注、进度等数据
- **services/**: 主进程业务逻辑服务

### Preload (src/preload)
安全地暴露主进程功能给渲染进程,使用contextBridge和ipcRenderer。

### 渲染进程 (src/renderer)
React应用,负责UI展示和用户交互。

- **pages/**: 页面级组件(书库、阅读器、设置)
- **components/**: 可复用的通用组件
- **modules/**: 按功能划分的业务模块
- **store/**: Zustand状态管理
- **hooks/**: 自定义React Hooks
- **utils/**: 工具函数
- **types/**: TypeScript类型定义

### 共享代码 (src/shared)
主进程和渲染进程都可以使用的代码。

- **types/**: 共享类型定义(Book, Annotation等)
- **constants/**: 共享常量(IPC通道名、默认设置等)

## 功能模块

### 1. 阅读器模块 (modules/reader)
- EPUB文件解析和渲染
- 分页/滚动模式
- CFI定位系统
- 主题和样式定制

### 2. 书库模块 (modules/library)
- 书籍导入和管理
- 元数据提取和编辑
- 标签和书架组织
- 搜索和筛选

### 3. 批注模块 (modules/annotation)
- 高亮、下划线、笔记、书签
- 批注管理和导出
- Markdown/JSON/PDF导出

### 4. 云同步模块 (modules/sync)
- 数据云端同步
- 冲突检测和解决
- 离线队列管理

### 5. AI助手模块 (modules/ai)
- 智能摘要
- 内容解释
- 问答对话

### 6. TTS模块 (modules/tts)
- 语音朗读
- 连续朗读
- 语音设置

### 7. 翻译模块 (modules/translation)
- 划词翻译
- 离线词典
- 生词本

## 技术栈

- **框架**: Electron 28+ / React 18+ / TypeScript 5+
- **UI**: TailwindCSS 3+ / Headless UI / Framer Motion
- **状态管理**: Zustand / React Query
- **阅读引擎**: epub.js
- **数据存储**: better-sqlite3 / electron-store
- **构建工具**: Vite / electron-builder

## 开发规范

### 文件命名
- 组件文件: PascalCase (例: `BookCard.tsx`)
- 工具函数: camelCase (例: `formatDate.ts`)
- Store文件: `use` + PascalCase + `Store` (例: `useBookStore.ts`)
- 常量文件: 全大写 (例: `CONSTANTS.ts`)

### 代码组织
- 每个模块独立,包含components、hooks、services子目录
- 公共组件放在`components/`目录
- 业务逻辑封装到services中
- 状态管理使用Zustand store

### 类型定义
- 共享类型定义在`src/shared/types/`
- 模块特定类型定义在模块内的`types/`目录
- 导出的接口和类型使用export声明

## 下一步工作

### 阶段一:核心功能
1. 实现EPUB阅读引擎
2. 完善书库管理功能
3. 实现本地数据存储

### 阶段二:高级功能
1. 批注系统
2. 云同步
3. AI助手

### 阶段三:优化打磨
1. 性能优化
2. UI/UX优化
3. 测试和修复

## 注意事项

1. **安全性**: 主进程和渲染进程严格分离,通过IPC通信
2. **性能**: 大文件使用流式读取,长列表使用虚拟化
3. **跨平台**: 注意不同平台的差异,使用条件编译
4. **类型安全**: 充分利用TypeScript,减少运行时错误
5. **代码规范**: 遵循ESLint和Prettier配置

## 参考文档

- [Electron官方文档](https://www.electronjs.org/docs)
- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [TailwindCSS官方文档](https://tailwindcss.com/docs)
- [epub.js文档](http://futurepress.org/epubjs/)
