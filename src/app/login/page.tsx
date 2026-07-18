'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [passo, setPasso] = useState<1 | 2>(1); // Passo 1: Enviar Email, Passo 2: Digitar Token OTP
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Solicitar o Envio do Código OTP por e-mail
  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // Cria o usuário automaticamente se for o primeiro acesso
        }
      });

      if (error) throw error;

      setMsg('Código enviado! Verifique sua caixa de entrada.');
      setPasso(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar código de acesso.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar o Código OTP digitado
  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      });

      if (error) throw error;

      if (data.session) {
        setMsg('Autenticado com sucesso! Redirecionando...');
        // Salva token/sessão e navega para o dashboard
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Código inválido ou expirado.');
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
        
        {/* Header Login */}
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Acesse o ControleFI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Autenticação rápida sem senha. Receba um código de verificação por e-mail.
          </p>
        </div>

        {/* Passo 1: Digitar E-mail */}
        {passo === 1 ? (
          <form onSubmit={handleEnviarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                SEU ENDEREÇO DE E-MAIL
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
                  placeholder="felipe@exemplo.com"
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', gap: '0.5rem' }}>
              {loading ? 'Enviando...' : 'Receber Código de Acesso'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Passo 2: Digitar Token OTP */
          <form onSubmit={handleValidarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                CÓDIGO DE 6 DÍGITOS ENVIADO PARA O E-MAIL
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem'
              }}>
                <KeyRound size={16} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
                <input 
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  required
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontSize: '0.9rem',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setPasso(1)} 
                disabled={loading} 
                style={{
                  flex: 1,
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Voltar
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary" 
                style={{ flex: 2, padding: '0.85rem' }}
              >
                {loading ? 'Verificando...' : 'Confirmar e Acessar'}
              </button>
            </div>
          </form>
        )}

        {/* Feedback visual */}
        {msg && (
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, marginTop: '1.25rem', textAlign: 'center' }}>
            {msg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, marginTop: '1.25rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

      </div>
    </div>
  );
}
