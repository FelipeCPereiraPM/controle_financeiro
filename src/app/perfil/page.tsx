'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Mail, Calendar, ShieldAlert } from 'lucide-react';

export default function Perfil() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function obterUsuario() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || null);
          setJoinedAt(user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : null);
        } else {
          // Se não estiver logado, redireciona para login
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    obterUsuario();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
        Buscando dados do seu perfil...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Meu Perfil</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gerencie sua conta e visualize suas credenciais de segurança do ControleFI.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Info Cabeçalho Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-glow)',
            border: '1px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem'
          }}>
            👤
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>Felipe C.</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plano Básico Gratuito</span>
          </div>
        </div>

        {/* Detalhamento Técnico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* E-mail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Endereço de E-mail</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{email}</span>
            </div>
          </div>

          {/* Data de Registro */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Membro desde</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{joinedAt}</span>
            </div>
          </div>

          {/* Nível de Segurança RLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--success)' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status da Carteira</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>Isolamento de Dados RLS Ativo</span>
            </div>
          </div>

        </div>

        {/* Botão de Logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--error-bg)',
              color: 'var(--error)',
              border: '1px solid var(--error)',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--error-bg)'}
          >
            <LogOut size={14} />
            Encerrar Sessão (Sair)
          </button>
        </div>

      </div>
    </div>
  );
}
