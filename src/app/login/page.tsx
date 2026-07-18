'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, KeyRound, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [passo, setPasso] = useState<1 | 2 | 3>(1); 
  // Passo 1: Digitar Email
  // Passo 2: Aguardar confirmação de e-mail de primeiro acesso
  // Passo 3: Digitar código OTP de 6 dígitos (para login recorrente)

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Solicitar o Acesso / Envio de OTP
  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      // Tentar enviar o código OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // Cria se não existir
        }
      });

      if (error) {
        // Tratar erro do Supabase quando o e-mail ainda não foi confirmado/cadastrado no fluxo tradicional
        if (error.message.includes('Email signup is disabled') || error.message.includes('confirm')) {
          setErrorMsg('Sua conta precisa de ativação. Enviamos um link de verificação para o seu e-mail.');
          return;
        }
        throw error;
      }

      // Supabase OTP envia um código que requer confirmação
      setMsg('Enviamos um e-mail de acesso. Se for seu primeiro login, verifique o e-mail para ativar sua conta antes de continuar.');
      setPasso(3); // Ir para digitação do código de 6 dígitos

    } catch (err: any) {
      if (err.message.includes('rate limit')) {
        setErrorMsg('Muitas solicitações seguidas. Aguarde alguns minutos e tente novamente.');
      } else {
        setErrorMsg(err.message || 'Erro ao processar o login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar o Código OTP de 6 dígitos
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
        setMsg('Acesso autorizado! Redirecionando para o seu dashboard...');
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Código inválido, expirado ou e-mail ainda não confirmado.');
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
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Acesse o ControleFI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Autenticação segura via e-mail sem precisar memorizar senhas.
          </p>
        </div>

        {/* PASSO 1: Inserção de E-mail */}
        {passo === 1 && (
          <form onSubmit={handleAcesso} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', gap: '0.5rem' }}>
              {loading ? 'Processando...' : 'Receber Código por E-mail'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* PASSO 3: Inserir Código OTP de 6 dígitos */}
        {passo === 3 && (
          <form onSubmit={handleValidarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Caixa Informativa sobre ativação de conta */}
            <div style={{
              backgroundColor: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                <CheckCircle size={14} />
                Primeiro acesso?
              </div>
              Caso seja o seu primeiro acesso ao ControleFI, você receberá um **e-mail de confirmação da sua conta**. É obrigatório abrir o e-mail e clicar no link de ativação antes de digitar o código de login abaixo.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                DIGITE O CÓDIGO DE 6 DÍGITOS
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
                  placeholder="000000"
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
                {loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
            </div>
          </form>
        )}

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
