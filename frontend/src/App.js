/**
 * 主应用组件
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:05:00
 */

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Player from './pages/Player';
import Admin, { AdminChannels, AdminCategories, AdminUpload, AdminUsers } from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/player/:channelId" element={<Player />} />
        <Route path="/admin" element={<Admin />}>
          <Route index element={<AdminChannels />} />
          <Route path="channels" element={<AdminChannels />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;