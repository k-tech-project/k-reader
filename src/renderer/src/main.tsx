/**
 * 渲染进程入口
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // 暂时禁用 StrictMode，它会导致组件双重挂载，影响 epub.js 的实例管理
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
