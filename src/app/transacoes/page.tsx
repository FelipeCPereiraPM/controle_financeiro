'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit3, X, Check, Plus } from 'lucide-react';

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

  // Modo da tela: 'create' (Criar) ou 'edit' (Editar)
  const [modoForm, setModoForm] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para inputs do form
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Estados para Filtro de Período
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
  const [ano, setAno] = useState(new Date().getFullYear());

  const anosDisponiveis = [2024, 2025, 2026, 2027];
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const carregarTransacoes = useCallback(async () => {
    try {
      setLoading(true);
      
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

  // Manipular Envio de Formulário (Criação ou Edição)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !data) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const payload = {
        data,
        descricao: descricao.trim(),
        valor: Math.abs(parseFloat(valor)),
        tipo,
        status: 'EFETIVADO',
        user_id: user.id
      };

      if (modoForm === 'edit' && editingId) {
        // Modo Edição (UPDATE)
        const { error } = await supabase
          .from('transacoes')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        cancelarEdicao();
      } else {
        // Modo Criação (INSERT)
        const { error } = await supabase
          .from('transacoes')
          .insert([payload]);

        if (error) throw error;
        
        setDescricao('');
        setValor('');
      }

      carregarTransacoes();
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
    }
  };

  // Iniciar modo de edição preenchendo os campos correspondentes
  const iniciarEdicao = (t: Transacao) => {
    setModoForm('edit');
    setEditingId(t.id);
    setDescricao(t.descricao);
    setValor(t.valor.toString());
    setTipo(t.tipo);
    setData(t.data);
  };

  const cancelarEdicao = () => {
    setModoForm('create');
    setEditingId(null);
    setDescricao('');
    setValor('');
    setData(new Date().toISOString().split('T')[0]);
    setTipo('SAIDA');
  };

  // Excluir Lançamento diretamente
  const handleExcluir = async (id: string) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir esta transação permanentemente?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Atualizar lista local
      setTransacoes(transacoes.filter(t => t.id !== id));
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '2rem' }}>
      
      {/* Listagem das Transações */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Transações</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Consolidado histórico das transações no período selecionado.
            </p>
          </div>

          {/* Seletores de Filtros */}
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

        {/* Tabela */}
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Buscando dados...
                  </td>
                </tr>
              ) : transacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
                    {/* Botões de Ação na Linha */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => iniciarEdicao(t)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          title="Editar Lançamento"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleExcluir(t.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          title="Excluir Lançamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Adicionar / Editar Lançamento */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
          {modoForm === 'edit' ? '✏️ Editar Lançamento' : '➕ Adicionar Lançamento'}
        </h2>
        <div className="card" style={{ border: modoForm === 'edit' ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
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

            {/* Ações do Form */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {modoForm === 'edit' && (
                <button 
                  type="button" 
                  onClick={cancelarEdicao} 
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
                  Cancelar
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 2, padding: '0.75rem' }}
              >
                {modoForm === 'edit' ? 'Salvar Edição' : 'Adicionar Transação'}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
