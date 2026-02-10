/**
 * 应用根组件
 */
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { Modal } from './components/Modal';
import { PageTransition } from './components/PageTransition';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

// 懒加载页面组件
const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const Reader = lazy(() => import('./pages/Reader').then(m => ({ default: m.Reader })));
const BookDetail = lazy(() => import('./pages/BookDetail').then(m => ({ default: m.BookDetail })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const WordBook = lazy(() => import('./pages/WordBook').then(m => ({ default: m.WordBook })));

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const location = useLocation();

  return (
    <PageTransition location={location}>
      <Routes location={location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<Library />} />
          <Route path="book/:bookId" element={<BookDetail />} />
          <Route path="reader/:bookId" element={<Reader />} />
          <Route path="wordbook" element={<WordBook />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </PageTransition>
  );
}

function App() {
  // 设置全局错误处理器
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <AppRoutes />
            </Suspense>

            {/* 全局 Toast 通知 */}
            <ToastContainer />
            {/* 全局 Modal */}
            <Modal />
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
