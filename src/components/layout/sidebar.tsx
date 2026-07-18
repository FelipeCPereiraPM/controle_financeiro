'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowLeftRight, 
  UploadCloud, 
  DollarSign, 
  Menu, 
  ChevronLeft,
  Briefcase
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: TrendingUp },
    { label: 'Investimentos', path: '/investimentos', icon: Briefcase },
    { label: 'Transações', path: '/transacoes', icon: ArrowLeftRight },
    { label: 'Importar Extrato', path: '/upload', icon: UploadCloud },
  ];

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
      backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: collapsed ? '1.5rem 0.75rem' : '1.5rem',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
      overflowX: 'hidden'
    }}>
      {/* Topo / Logo + Minimizar */}
      <div style={{ 
        marginBottom: '2.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '0.5rem'
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#000'
            }}>
              $
            </div>
            <span style={{
              fontFamily: 'var(--font-title)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              Controle<span style={{ color: 'var(--primary)' }}>FI</span>
            </span>
          </div>
        )}

        {/* Botão Minimizar */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={collapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Links de Navegação Dinâmicos */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              href={item.path} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                backgroundColor: isActive ? 'var(--surface-hover)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Usuário */}
      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '0.75rem',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          flexShrink: 0
        }}>
          👤
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Felipe C.</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plano Free</span>
          </div>
        )}
      </div>
    </aside>
  );
}
