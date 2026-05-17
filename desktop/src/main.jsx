/**
 * FluxTV 桌面应用入口文件
 *
 * 作者：19920728
 * 版本：1.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * 渲染应用
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
);
