'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';

interface IndicatorData {
  valor: number;
  variacao?: number;
  nome?: string;
}

interface IndicadoresResponse {
  dolar: IndicatorData;
  ibovespa: IndicatorData;
  selic: IndicatorData;
  ipca: IndicatorData;
}

export default function MarketHeader() {
  const [data, setData] = useState<IndicadoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado do Tema (Light / Dark)
  const [tema, setTema] = useState<'dark' | 'light'>('dark');

  // Inicializar o Tema a partir do LocalStorage
  useEffect(() => {
    const temaSalvo = localStorage.getItem('theme') as 'dark' | 'light';
    if (temaSalvo) {
      setTema(temaSalvo);
      document.documentElement.setAttribute('data-theme', temaSalvo);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTema = () => {
    const novoTema = tema === 'dark' ? 'light' : 'dark';
    setTema(novoTema);
    document.documentElement.setAttribute('data-theme', novoTema);
    localStorage.setItem('theme', novoTema);
  };

  async function carregarIndicadores() {
    try {
      setLoading(true);
      const mockData: IndicadoresResponse = {
        dolar: { valor: 5.11, variacao: -0.15 },
        ibovespa: { valor: 173714.00, variacao: 0.45 },
        selic: { valor: 14.25, nome: "Taxa Selic" },
        ipca: { valor: 4.25, nome: "IPCA (12m)" }
      };
      setData(mockData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarIndicadores();
  }, []);

  if (loading || !data) {
    return (
      <div style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.85rem 2rem',
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <RefreshCw size={14} className="animate-spin" /> Atualizando índices financeiros de mercado...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0.85rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      
      {/* Canto Esquerdo: Botão Alternador de Tema + Indicadores */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Botão de Light/Dark Mode no canto esquerdo da barra */}
        <button 
          onClick={toggleTema}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'all 0.2s ease',
          }}
          title={tema === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {tema === 'dark' ? (
            <Sun size={15} style={{ color: 'var(--primary)' }} />
          ) : (
            <Moon size={15} style={{ color: 'var(--primary)' }} />
          )}
        </button>

        <div style={{ borderLeft: '1px solid var(--border)', height: '20px' }} />

        {/* IBOVESPA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>IBOVESPA:</span>
          <span style={{ fontWeight: 700 }}>
            {data.ibovespa.valor.toLocaleString('pt-BR')} pts
          </span>
          <span style={{ 
            color: (data.ibovespa.variacao || 0) >= 0 ? 'var(--success)' : 'var(--error)',
            fontWeight: 600,
            fontSize: '0.82rem'
          }}>
            {(data.ibovespa.variacao || 0) >= 0 ? '+' : ''}{data.ibovespa.variacao}%
          </span>
        </div>

        {/* DOLAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>DÓLAR:</span>
          <span style={{ fontWeight: 700 }}>
            R$ {data.dolar.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ 
            color: (data.dolar.variacao || 0) >= 0 ? 'var(--success)' : 'var(--error)',
            fontWeight: 600,
            fontSize: '0.82rem'
          }}>
            {(data.dolar.variacao || 0) >= 0 ? '+' : ''}{data.dolar.variacao}%
          </span>
        </div>

        {/* SELIC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>SELIC:</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
            {data.selic.valor.toFixed(2)}%
          </span>
        </div>

        {/* IPCA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>IPCA (12m):</span>
          <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
            {data.ipca.valor.toFixed(2)}%
          </span>
        </div>

      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Bolsa em Tempo Real 🟢
      </div>

    </div>
  );
}
