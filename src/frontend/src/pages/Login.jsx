import React, { useState } from 'react';
import api from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/user/login', { username, password });
      setMsg('登录成功，欢迎 ' + res.data.nickname);
    } catch (err) {
      setMsg('登录失败：' + (err.response?.data || '未知错误'));
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: 300, margin: '100px auto' }}>
      <div>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" />
      </div>
      <div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
      </div>
      <button type="submit">登录</button>
      <div>{msg}</div>
    </form>
  );
} 