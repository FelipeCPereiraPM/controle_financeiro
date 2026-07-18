'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Resumo {
  totalEntradas: number;
  totalSaidas: number;
  saldoGeral: number;
}

interface Transacao {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'ENTRADA' | 'SAIDA';
  status: string;
}

interface ChartData {
  name: string;
  receitas: number;
  despesas: number;
}

interface CategoriaData {
  name: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<Resumo>({ totalEntradas: 0, totalSaidas: 0, saldoGeral: 0 });
  const [recentes, setRecentes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12
  const [ano, setAno] = useState(new Date().getFullYear());

  // Dados para os Gráficos
  const [dadosGraficoLinha, setDadosGraficoLinha] = useState<ChartData[]>([]);
  const [dadosCategorias, setDadosCategorias] = useState<CategoriaData[]>([]);

  const anosDisponiveis = [2024, 2025, 2026, 2027];
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        
        // Formatar datas para o filtro de início e fim do mês
        const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`;

        // 1. Carregar transações do mês filtrado
        const { data: transacoesFiltradas, error: errTrans } = await supabase
          .from('transacoes')
          .select('*')
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .order('data', { ascending: false });

        if (errTrans) throw errTrans;

        // 2. Transações recentes (Últimas 5 no geral)
        const { data: ultimas, error: errUltimas } = await supabase
          .from('transacoes')
          .select('*')
          .order('data', { ascending: false })
          .limit(5);

        if (errUltimas) throw errUltimas;
        setRecentes(ultimas || []);

        // 3. Processar Resumos e Totais
        let entradas = 0;
        let saidas = 0;
        const categoriasMap: { [key: string]: { value: number; color: string } } = {};

        transacoesFiltradas?.forEach(t => {
          const v = Number(t.valor);
          if (t.tipo === 'ENTRADA') {
            entradas += v;
          } else {
            saidas += v;
            // Somar por categoria para o gráfico de rosca
            const catNome = t.id_categoria ? 'Categorizado' : 'Geral';
            if (categoriasMap[catNome]) {
              categoriasMap[catNome].value += v;
            } else {
              categoriasMap[catNome] = { value: v, color: '#00b4d8' };
            }
          }
        });

        setResumo({
          totalEntradas: entradas,
          totalSaidas: saidas,
          saldoGeral: entradas - saidas
        });

        // 4. Estruturar dados para gráfico de Evolução do Mês (diário)
        const diasNoMes = new Date(ano, mes, 0).getDate();
        const diasData: ChartData[] = [];
        for (let d = 1; d <= diasNoMes; d++) {
          diasData.push({
            name: `${d}/${mes}`,
            receitas: 0,
            despesas: 0
          });
        }

        transacoesFiltradas?.forEach(t => {
          const diaTransacao = new Date(t.data + 'T00:00:00').getDate();
          if (diaTransacao <= diasNoMes) {
            const idx = diaTransacao - 1;
            if (t.tipo === 'ENTRADA') {
              diasData[idx].receitas += Number(t.valor);
            } else {
              diasData[idx].despesas += Number(t.valor);
            }
          }
        });

        setDadosGraficoLinha(diasData);

        // Gráfico de categorias estático/dinâmico simplificado para o exemplo
        const coresDefault = ['#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
        const formatCategorias = Object.keys(categoriasMap).map((key, i) => ({
          name: key,
          value: categoriasMap[key].value,
          color: coresDefault[i % coresDefault.length]
        }));

        setDadosCategorias(formatCategorias.length > 0 ? formatCategorias : [{ name: 'Sem Despesas', value: 1, color: '#334155' }]);

      } catch (err) {
        console.error("Erro ao filtrar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [mes, ano]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header com Filtros de Mês e Ano (Estilo Investidor10) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Visão Geral</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Acompanhe o balanço de suas receitas, despesas e investimentos.</p>
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

      {/* Grid de Resumos Financeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card Saldo Geral */}
        <div className="card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>SALDO GERAL (MÊS SELECIONADO)</span>
          <div style={{
            fontSize: '1.85rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: resumo.saldoGeral >= 0 ? 'var(--success)' : 'var(--error)',
            marginTop: '0.5rem'
          }}>
            R$ {resumo.saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Consolidado com base no período filtrado
          </span>
        </div>

        {/* Card Entradas */}
        <div className="card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>RECEITAS (MÊS SELECIONADO)</span>
          <div style={{
            fontSize: '1.85rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: 'var(--success)',
            marginTop: '0.5rem'
          }}>
            + R$ {resumo.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Salários, rendimentos e outros ganhos
          </span>
        </div>

        {/* Card Saídas */}
        <div className="card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>DESPESAS (MÊS SELECIONADO)</span>
          <div style={{
            fontSize: '1.85rem',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            color: 'var(--error)',
            marginTop: '0.5rem'
          }}>
            - R$ {resumo.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Faturas de cartões e saídas de débito
          </span>
        </div>

      </div>

      {/* Gráficos de Evolução Financeira */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando Gráficos...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Gráfico de Evolução de Área */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '380px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Fluxo de Caixa diário ({mesesNomes[mes - 1]})</h3>
            <div style={{ flexGrow: 1, width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dadosGraficoLinha}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--error)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      ''
                    ]}
                  />

                  <Area type="monotone" dataKey="receitas" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorReceitas)" name="Receitas" />
                  <Area type="monotone" dataKey="despesas" stroke="var(--error)" strokeWidth={2} fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Rosca de Divisão */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '380px', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Divisão de Despesas</h3>
            <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dadosCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} 
                    formatter={(value: any) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      'Total'
                    ]}
                  />

                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legendas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', maxHeight: '100px' }}>
              {dadosCategorias.map((c) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tabela de Transações Recentes */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Lançamentos Recentes (Todas Contas)</h2>
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
              {recentes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Nenhuma movimentação registrada. Use a aba de importação ou manuais.
                  </td>
                </tr>
              ) : (
                recentes.map((t) => (
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
    </div>
  );
}
