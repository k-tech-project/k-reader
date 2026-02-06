/**
 * 应用布局组件
 */
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部可拖拽标题栏（用于无边框窗口） */}
      <div
        className="flex h-8 items-center border-b border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 select-none"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <div className="tracking-wide">K-Reader</div>
      </div>
      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
