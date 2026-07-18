'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Briefcase, 
  Wallet,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface Ativo {
  id: string;
  ticker: string;
  tipo: string;
  quantidade: number;
  custo_medio: number;
  cotacao_atual: number;
}

interface AlocacaoGrafico {
  name: string;
  value: number;
  color: string;
}

interface LinhaHistorico {
  ano: number;
  meses: number[]; 
  total: number;
  media: number;
}

export default function Investimentos() {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Valores Consolidados
  const [totalInvestido, setTotalInvestido] = useState(0);
  const [valorAtual, setValorAtual] = useState(0);

  // Histórico Mensal de Proventos
  const [historicoProventos, setHistoricoProventos] = useState<LinhaHistorico[]>([]);
  const [proventosAcumuladosTotal, setProventosAcumuladosTotal] = useState(0);

  // Estados do Conversor Integrado
  const [showConverter, setShowConverter] = useState(false);
  const [usdInput, setUsdInput] = useState('');
  const [brlInput, setBrlInput] = useState('');
  const dolarTaxa = 5.11;

  const carregarInvestimentos = async () => {
    try {
      setLoading(true);
      
      // Consultar transações reais do usuário logado atreladas ao seu id
      // e que sejam da categoria 'Investimentos'
      const { data: categoriaInvest } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', 'Investimentos')
        .single();

      let transacoesInvest: any[] = [];
      if (categoriaInvest) {
        const { data: transacoes } = await supabase
          .from('transacoes')
          .select('data, valor, tipo')
          .eq('id_categoria', categoriaInvest.id)
          .eq('tipo', 'ENTRADA');
        transacoesInvest = transacoes || [];
      }

      // IMPORTANTE: Como a carteira deve iniciar zerada para perfis novos,
      // não criamos dados mockados rígidos se não houver registros salvos no banco.
      const carteiraUsuario: Ativo[] = []; // Inicia vazia por padrão
      setAtivos(carteiraUsuario);

      // Calcular totais
      let investido = 0;
      let atual = 0;
      carteiraUsuario.forEach(a => {
        investido += a.quantidade * a.custo_medio;
        atual += a.quantidade * a.cotacao_atual;
      });

      setTotalInvestido(investido);
      setValorAtual(atual);

      // Processar transações de proventos do usuário (se houver)
      if (transacoesInvest.length === 0) {
        setHistoricoProventos([]);
        setProventosAcumuladosTotal(0);
      } else {
        const agrupado: { [key: number]: number[] } = {};
        let acumuladoTotal = 0;

        transacoesInvest.forEach(t => {
          const dt = new Date(t.data + 'T00:00:00');
          const anoT = dt.getFullYear();
          const mesT = dt.getMonth();
          const val = Number(t.valor);

          acumuladoTotal += val;

          if (!agrupado[anoT]) {
            agrupado[anoT] = Array(12).fill(0.00);
          }
          agrupado[anoT][mesT] += val;
        });

        const linhas: LinhaHistorico[] = Object.keys(agrupado)
          .map(anoStr => {
            const a = Number(anoStr);
            const mesesValores = agrupado[a];
            const soma = mesesValores.reduce((acc, curr) => acc + curr, 0);
            const mesesPreenchidos = mesesValores.filter(v => v > 0).length || 1;
            const avg = soma / mesesPreenchidos;

            return {
              ano: a,
              meses: mesesValores.map(v => parseFloat(v.toFixed(2))),
              total: parseFloat(soma.toFixed(2)),
              media: parseFloat(avg.toFixed(2))
            };
          })
          .sort((x, y) => y.ano - x.ano);

        setHistoricoProventos(linhas);
        setProventosAcumuladosTotal(acumuladoTotal);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarInvestimentos();
  }, []);

  const totalLucroPrejuizo = valorAtual - totalInvestido;
  const rentabilidadePercentual = totalInvestido > 0 ? (totalLucroPrejuizo / totalInvestido) * 100 : 0;

  // Alocação
  const alocacaoMap: { [key: string]: number } = {};
  ativos.forEach(a => {
    const val = a.quantidade * a.cotacao_atual;
    alocacaoMap[a.tipo] = (alocacaoMap[a.tipo] || 0) + val;
  });

  const coresDefault = ['#00b4d8', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  const dadosAlocacao: AlocacaoGrafico[] = Object.keys(alocacaoMap).map((key, idx) => ({
    name: key,
    value: alocacaoMap[key],
    color: coresDefault[idx % coresDefault.length]
  }));

  // Rentabilidade
  const dadosRentabilidadeTicker = ativos.map(a => {
    const investido = a.quantidade * a.custo_medio;
    const atual = a.quantidade * a.cotacao_atual;
    const rent = investido > 0 ? ((atual - investido) / investido) * 100 : 0;
    return {
      ticker: a.ticker,
      rentabilidade: parseFloat(rent.toFixed(2))
    };
  });

  // Handlers do conversor
  const handleUsdChange = (val: string) => {
    setUsdInput(val);
    if (!val || isNaN(Number(val))) {
      setBrlInput('');
      return;
    }
    setBrlInput((Number(val) * dolarTaxa).toFixed(2));
  };

  const handleBrlChange = (val: string) => {
    setBrlInput(val);
    if (!val || isNaN(Number(val))) {
      setUsdInput('');
      return;
    }
    setUsdInput((Number(val) / dolarTaxa).toFixed(2));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header com Conversor ao lado do Subtítulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💰 Meus Investimentos</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Acompanhe a alocação e performance da sua carteira de ativos.
            </p>
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowConverter(!showConverter)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Calculator size={11} style={{ color: 'var(--primary)' }} />
                Simular Câmbio USD
              </button>

              {/* Popup do Conversor */}
              {showConverter && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '120%',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '1rem',
                  width: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  zIndex: 200
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', display: 'block' }}>
                    Calculadora USD / BRL
                  </span>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>DÓLAR (USD)</label>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>$</span>
                      <input 
                        type="number"
                        value={usdInput}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        placeholder="0.00"
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          width: '100%',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>REAL (BRL)</label>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>R$</span>
                      <input 
                        type="number"
                        value={brlInput}
                        onChange={(e) => handleBrlChange(e.target.value)}
                        placeholder="0.00"
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          width: '100%',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>

                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Conversão base: 1 USD = R$ {dolarTaxa.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>VALOR ATUAL DA CARTEIRA</span>
            <Wallet size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-title)', fontWeight: 700, marginTop: '0.5rem' }}>
            R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Preço de mercado dos seus ativos
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>VALOR TOTAL INVESTIDO</span>
            <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-title)', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Patrimônio de custo de aquisição
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>LUCRO / PREJUÍZO GLOBAL</span>
            <TrendingUp size={16} style={{ color: totalLucroPrejuizo >= 0 ? 'var(--success)' : 'var(--error)' }} />
          </div>
          <div style={{ 
            fontSize: '1.85rem', 
            fontFamily: 'var(--font-title)', 
            fontWeight: 700, 
            marginTop: '0.5rem',
            color: totalLucroPrejuizo >= 0 ? 'var(--success)' : 'var(--error)' 
          }}>
            R$ {totalLucroPrejuizo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Rentabilidade acumulada de {rentabilidadePercentual.toFixed(2)}%
          </span>
        </div>

      </div>

      {/* Gráficos de Carteira */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '340px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Distribuição de Ativos (Alocação)</h3>
          {ativos.length === 0 ? (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nenhum ativo cadastrado na carteira.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <div style={{ width: '50%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosAlocacao}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosAlocacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dadosAlocacao.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      {((d.value / valorAtual) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '340px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Rentabilidade por Ativo (%)</h3>
          {ativos.length === 0 ? (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nenhum ativo cadastrado na carteira.
            </div>
          ) : (
            <div style={{ flexGrow: 1, width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosRentabilidadeTicker}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="ticker" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="rentabilidade" name="Rentabilidade %">
                    {dadosRentabilidadeTicker.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.rentabilidade >= 0 ? 'var(--success)' : 'var(--error)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Detalhamento dos Ativos */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Minha Carteira</h2>
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Classe</th>
                <th>Qtd.</th>
                <th>Custo Médio</th>
                <th>Preço Atual</th>
                <th>Total Custo</th>
                <th>Valor Atual</th>
                <th style={{ textAlign: 'right' }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {ativos.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Nenhum ativo cadastrado. Suas movimentações de investimento aparecerão aqui.
                  </td>
                </tr>
              ) : (
                ativos.map(a => {
                  const totalCusto = a.quantidade * a.custo_medio;
                  const totalAtual = a.quantidade * a.cotacao_atual;
                  const res = totalAtual - totalCusto;
                  const resPct = totalCusto > 0 ? (res / totalCusto) * 100 : 0;

                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{a.ticker}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.tipo}</td>
                      <td>{a.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</td>
                      <td>R$ {a.custo_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ {a.cotacao_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 600 }}>R$ {totalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 600,
                        color: res >= 0 ? 'var(--success)' : 'var(--error)'
                      }}>
                        R$ {res.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({resPct >= 0 ? '+' : ''}{resPct.toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico Mensal de Proventos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Histórico mensal</h2>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            Total: <span style={{ color: 'var(--success)' }}>R$ {proventosAcumuladosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        
        <div className="table-container">
          <table className="table-premium table-wide" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Ano</th>
                <th style={{ textAlign: 'center' }}>Jan</th>
                <th style={{ textAlign: 'center' }}>Fev</th>
                <th style={{ textAlign: 'center' }}>Mar</th>
                <th style={{ textAlign: 'center' }}>Abr</th>
                <th style={{ textAlign: 'center' }}>Mai</th>
                <th style={{ textAlign: 'center' }}>Jun</th>
                <th style={{ textAlign: 'center' }}>Jul</th>
                <th style={{ textAlign: 'center' }}>Ago</th>
                <th style={{ textAlign: 'center' }}>Set</th>
                <th style={{ textAlign: 'center' }}>Out</th>
                <th style={{ textAlign: 'center' }}>Nov</th>
                <th style={{ textAlign: 'center' }}>Dez</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Média</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {historicoProventos.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Nenhum provento registrado neste perfil.
                  </td>
                </tr>
              ) : (
                historicoProventos.map((linha) => (
                  <tr key={linha.ano}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{linha.ano}</td>
                    {linha.meses.map((valorMes, idx) => (
                      <td key={idx} style={{ 
                        textAlign: 'center', 
                        color: valorMes > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.85rem'
                      }}>
                        {valorMes > 0 ? valorMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {linha.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      color: 'var(--text-primary)'
                    }}>
                      R$ {linha.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
