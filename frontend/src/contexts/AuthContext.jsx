import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import http from '../api/http.js';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [perfil, setPerfil] = useState(() => localStorage.getItem('perfil'));
  const [nome, setNome] = useState(() => localStorage.getItem('nome'));
  const [socket, setSocket] = useState(null);
  // Callbacks registrados pelas telas para serem chamados na reconexão (RNF21)
  const reconectarCb = useRef(null);

  const registrarReconexao = useCallback((cb) => {
    reconectarCb.current = cb;
    return () => { reconectarCb.current = null; };
  }, []);

  useEffect(() => {
    if (!token) return;

    const s = io(API_URL, {
      auth: { token },
      reconnection: true,
    });

    s.on('connect', () => {
      // Na reconexão, dispara o callback da tela aberta (RNF21)
      reconectarCb.current?.();
    });

    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  async function login(email, senha) {
    const { data } = await http.post('/api/auth/login', { email, senha });
    localStorage.setItem('token', data.token);
    localStorage.setItem('perfil', data.perfil);
    localStorage.setItem('nome', data.nome);
    setToken(data.token);
    setPerfil(data.perfil);
    setNome(data.nome);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('nome');
    socket?.disconnect();
    setSocket(null);
    setToken(null);
    setPerfil(null);
    setNome(null);
  }

  return (
    <AuthContext.Provider value={{ token, perfil, nome, socket, login, logout, registrarReconexao }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
