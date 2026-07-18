'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Transacao {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'ENTRADA' | 'SAIDA';
  status: string;
}

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Filtro de Período
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
  const [ano, setAno] = useState(new Date().getFullYear());

  // Estados para inserção manual
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const anosDisponiveis = [2024, 2025, 2026, 2027];
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const carregarTransacoes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Formatar limites de data baseados nos filtros de Mês e Ano
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`;

      const { data: res, error } = await supabase
        .from('transacoes')
        .select('*')
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: false });

      if (error) throw error;
      setTransacoes(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);

  const handleManualInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !data) return;

    try {
      // Obter o usuário logado para associar a transação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const novaTransacao = {
        data,
        descricao,
        valor: Math.abs(parseFloat(valor)),
        tipo,
        status: 'EFETIVADO',
        user_id: user.id // Associar transação ao ID do usuário autenticado
      };

      const { error } = await supabase.from('transacoes').insert([novaTransacao]);
      if (error) throw error;

      // Limpar formulário
      setDescricao('');
      setValor('');
      
      // Recarregar lista
      carregarTransacoes();
    } catch (err) {
      console.error("Erro ao inserir transação:", err);
    }
  };


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      
      {/* Listagem das Transações com Filtro no Topo */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Transações</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Consolidado histórico das transações no período selecionado.
            </p>
          </div>

          {/* Seletores de Filtros de Mês e Ano */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--surface)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <select 
              value={mes} 
              onChange={(e) => setMes(Number(e.target.value))}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none'
              }}>
              {mesesNomes.map((n, idx) => (
                <option key={n} value={idx + 1} style={{ backgroundColor: 'var(--surface)' }}>{n}</option>
              ))}
            </select>

            <div style={{ borderLeft: '1px solid var(--border)', margin: '0.25rem 0' }} />

            <select 
              value={ano} 
              onChange={(e) => setAno(Number(e.target.value))}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none'
              }}>
              {anosDisponiveis.map(a => (
                <option key={a} value={a} style={{ backgroundColor: 'var(--surface)' }}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Buscando dados...
                  </td>
                </tr>
              ) : transacoes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhuma movimentação registrada neste período.
                  </td>
                </tr>
              ) : (
                transacoes.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{t.descricao}</td>
                    <td>
                      <span className={`badge ${t.tipo === 'ENTRADA' ? 'badge-success' : 'badge-error'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.status}</td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: t.tipo === 'ENTRADA' ? 'var(--success)' : 'var(--text-primary)'
                    }}>
                      {t.tipo === 'ENTRADA' ? '+ ' : '- '} 
                      R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Inserção Manual */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Adicionar Lançamento</h2>
        <div className="card">
          <form onSubmit={handleManualInsert} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>DESCRICÃO</label>
              <input 
                type="text" 
                value={descricao} 
                onChange={(e) => setDescricao(e.target.value)} 
                placeholder="Ex: Aluguel, Mercado, Salário..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>VALOR (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={valor} 
                onChange={(e) => setValor(e.target.value)} 
                placeholder="0.00"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>DATA</label>
              <input 
                type="date" 
                value={data} 
                onChange={(e) => setData(e.target.value)} 
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TIPO</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setTipo('SAIDA')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: tipo === 'SAIDA' ? 'var(--error-bg)' : 'transparent',
                    border: `1px solid ${tipo === 'SAIDA' ? 'var(--error)' : 'var(--border)'}`,
                    color: tipo === 'SAIDA' ? 'var(--error)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                  Despesa
                </button>
                <button 
                  type="button" 
                  onClick={() => setTipo('ENTRADA')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: tipo === 'ENTRADA' ? 'var(--success-bg)' : 'transparent',
                    border: `1px solid ${tipo === 'ENTRADA' ? 'var(--success)' : 'var(--border)'}`,
                    color: tipo === 'ENTRADA' ? 'var(--success)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                  Receita
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
              Adicionar Transação
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
