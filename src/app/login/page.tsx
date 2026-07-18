'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  
  // Estados do Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Modo da tela: 'login' (Entrar) ou 'signup' (Criar Conta)
  const [modo, setModo] = useState<'login' | 'signup'>('login');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAutenticacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      if (modo === 'signup') {
        // Criar Novo Usuário
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            // Nota: Se a confirmação de e-mail estiver ativa no Supabase,
            // o usuário será cadastrado mas precisará clicar no e-mail de ativação uma única vez.
            // Para melhor experiência se a confirmação estiver ligada:
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        if (data.user) {
          // Checar se o usuário foi criado e requer confirmação
          const { session } = data;
          if (!session) {
            setMsg('Cadastro realizado! Enviamos um link de ativação para o seu e-mail. Por favor, clique no link para validar sua conta antes de fazer o primeiro login.');
          } else {
            setMsg('Conta criada com sucesso! Redirecionando...');
            router.push('/');
          }
        }
      } else {
        // Realizar Login Tradicional
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) throw error;

        if (data.session) {
          setMsg('Login efetuado com sucesso! Entrando...');
          router.push('/');
        }
      }
    } catch (err: any) {
      if (err.message.includes('confirm')) {
        setErrorMsg('Por favor, ative sua conta clicando no link enviado para o seu e-mail.');
      } else if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else {
        setErrorMsg(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-glow)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '1px solid var(--primary)'
          }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {modo === 'login' ? 'Acesse o ControleFI' : 'Criar minha Conta'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {modo === 'login' 
              ? 'Entre com suas credenciais de acesso' 
              : 'Cadastre seu e-mail e senha para começar'
            }
          </p>
        </div>

        {/* Formulário único */}
        <form onSubmit={handleAutenticacao} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* E-mail */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              ENDEREÇO DE E-MAIL
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem'
            }}>
              <Mail size={16} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              SENHA DE ACESSO
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem'
            }}>
              <Lock size={16} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', gap: '0.5rem', marginTop: '0.5rem' }}>
            {loading ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Cadastrar e Ativar')}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Alternador de Modo (Login / Signup) */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          {modo === 'login' ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              Não tem uma conta?{' '}
              <button 
                type="button" 
                onClick={() => setModo('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                Cadastre-se grátis
              </button>
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              Já possui cadastro?{' '}
              <button 
                type="button" 
                onClick={() => setModo('login')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                Fazer Login
              </button>
            </span>
          )}
        </div>

        {/* Feedbacks de Status */}
        {msg && (
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, marginTop: '1.25rem' }}>
            {msg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, marginTop: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

      </div>
    </div>
  );
}
