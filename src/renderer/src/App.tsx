/**
 * 应用根组件
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Library } from './pages/Library';
import { Reader } from './pages/Reader';
import { BookDetail } from './pages/BookDetail';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { Modal } from './components/Modal';

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="library" element={<Library />} />
            <Route path="book/:bookId" element={<BookDetail />} />
            <Route path="reader/:bookId" element={<Reader />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      {/* 全局 Toast 通知 */}
      <ToastContainer />
      {/* 全局 Modal */}
      <Modal />
    </QueryClientProvider>
  );
}

export default App;
