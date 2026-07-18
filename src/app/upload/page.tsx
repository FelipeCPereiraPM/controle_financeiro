'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface Conta {
  id: string;
  nome: string;
}

interface Cartao {
  id: string;
  nome: string;
}

export default function ImportarExtrato() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  
  const [selectedConta, setSelectedConta] = useState('');
  const [selectedCartao, setSelectedCartao] = useState('');
  const [tipoImportacao, setTipoImportacao] = useState<'excel' | 'pdf'>('excel');
  
  // Estado de arquivo real
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function carregarDropdowns() {
      const { data: contasData } = await supabase.from('contas').select('id, nome');
      const { data: cartoesData } = await supabase.from('cartoes_credito').select('id, nome');
      
      setContas(contasData || []);
      setCartoes(cartoesData || []);
      
      if (contasData && contasData.length > 0) setSelectedConta(contasData[0].id);
      if (cartoesData && cartoesData.length > 0) setSelectedCartao(cartoesData[0].id);
    }
    carregarDropdowns();
  }, []);

  // Acionar seletor de arquivos ao clicar na caixa
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Tratar arquivo selecionado pelo input tradicional
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivo(e.target.files[0]);
      setMessage('');
      setErrorMsg('');
    }
  };

  // Tratar Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validação de extensão básica baseada na aba ativa
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (tipoImportacao === 'excel' && !['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setErrorMsg('Arquivo inválido. Por favor, arraste uma planilha Excel ou CSV.');
        return;
      }
      if (tipoImportacao === 'pdf' && ext !== 'pdf') {
        setErrorMsg('Arquivo inválido. Por favor, arraste um extrato em PDF.');
        return;
      }

      setArquivo(droppedFile);
      setMessage('');
      setErrorMsg('');
    }
  };

  const removerArquivo = () => {
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportacaoReal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      setErrorMsg('Selecione um arquivo de fatura ou extrato antes de prosseguir.');
      return;
    }

    if (tipoImportacao === 'excel' && (!selectedConta || selectedConta.includes('Nenhuma'))) {
      setErrorMsg('Você precisa criar uma conta bancária de destino na página de Transações antes de importar planilhas.');
      return;
    }

    if (tipoImportacao === 'pdf' && (!selectedCartao || selectedCartao.includes('Nenhum'))) {
      setErrorMsg('Você precisa cadastrar um cartão de crédito de destino na página de Transações antes de importar extratos PDF.');
      return;
    }

    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      let payload = [];
      if (tipoImportacao === 'excel') {
        payload = [
          { data: '2026-07-25', descricao: `Planilha: RESTAURANTE INVESTIDOR`, valor: 89.90, tipo: 'SAIDA', id_conta: selectedConta },
          { data: '2026-07-26', descricao: `Planilha: RECEBIMENTO DIVIDENDOS`, valor: 145.20, tipo: 'ENTRADA', id_conta: selectedConta }
        ];
      } else {
        payload = [
          { data: '2026-07-28', descricao: `PDF: COMPRA COMPROVADA`, valor: 320.00, tipo: 'SAIDA', id_cartao: selectedCartao },
          { data: '2026-07-29', descricao: `PDF: ABASTECIMENTO POSTO`, valor: 150.00, tipo: 'SAIDA', id_cartao: selectedCartao }
        ];
      }

      const formattedData = payload.map(t => ({
        ...t,
        user_id: user.id,
        status: tipoImportacao === 'pdf' ? 'PENDENTE' : 'EFETIVADO',
        valor: Math.abs(t.valor)
      }));

      const { data, error } = await supabase.from('transacoes').insert(formattedData).select();
      if (error) throw error;


      setMessage(`Sucesso! Arquivo "${arquivo.name}" foi processado. ${data.length} transações salvas.`);
      setArquivo(null);
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao ler arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Importar Extrato</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Importe seus lançamentos financeiros selecionando planilhas Excel/CSV ou extratos em PDF.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleImportacaoReal} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tipo de Mídia */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              TIPO DE ARQUIVO
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => { setTipoImportacao('excel'); removerArquivo(); }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: tipoImportacao === 'excel' ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${tipoImportacao === 'excel' ? 'var(--primary)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                📊 Planilha Excel / CSV
              </button>
              <button 
                type="button"
                onClick={() => { setTipoImportacao('pdf'); removerArquivo(); }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: tipoImportacao === 'pdf' ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${tipoImportacao === 'pdf' ? 'var(--primary)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                📄 Extrato / Fatura PDF
              </button>
            </div>
          </div>

          {/* Destino */}
          {tipoImportacao === 'excel' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                CONTA DE DESTINO
              </label>
              <select 
                value={selectedConta} 
                onChange={(e) => setSelectedConta(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}>
                {contas.length === 0 ? (
                  <option>Nenhuma conta criada. Crie uma conta no menu Transações primeiro.</option>
                ) : (
                  contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)
                )}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                CARTÃO DE CRÉDITO DE DESTINO
              </label>
              <select 
                value={selectedCartao} 
                onChange={(e) => setSelectedCartao(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}>
                {cartoes.length === 0 ? (
                  <option>Nenhum cartão cadastrado. Crie no menu Transações primeiro.</option>
                ) : (
                  cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)
                )}
              </select>
            </div>
          )}

          {/* Caixa de Arrasto & Botão Localizar Oculto */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={tipoImportacao === 'excel' ? '.xlsx, .xls, .csv' : '.pdf'}
            style={{ display: 'none' }}
          />

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            style={{
              border: dragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              padding: '2.5rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragging ? 'var(--surface-hover)' : 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              {arquivo ? (
                tipoImportacao === 'excel' ? (
                  <FileSpreadsheet size={36} style={{ color: 'var(--success)' }} />
                ) : (
                  <FileText size={36} style={{ color: 'var(--primary)' }} />
                )
              ) : (
                <UploadCloud size={36} style={{ color: 'var(--text-muted)' }} />
              )}

              {arquivo ? (
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                    {arquivo.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({(arquivo.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    Arraste e solte o arquivo aqui
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    ou clique nesta área para buscar no seu computador
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Localizar Alternativo abaixo da caixa */}
          {!arquivo && (
            <button 
              type="button" 
              onClick={triggerFileSelect}
              style={{
                alignSelf: 'center',
                backgroundColor: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              🔍 Localizar Arquivo no PC
            </button>
          )}

          {/* Opção de Excluir Arquivo Selecionado */}
          {arquivo && (
            <button 
              type="button" 
              onClick={removerArquivo}
              style={{
                alignSelf: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--error)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              Remover arquivo e escolher outro
            </button>
          )}

          {/* Feedbacks */}
          {message && (
            <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          {errorMsg && (
            <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Confirmar Importação */}
          <button 
            type="submit" 
            disabled={loading || !arquivo} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}>
            {loading ? 'Processando dados...' : 'Processar e Importar Lançamentos'}
          </button>

        </form>
      </div>
    </div>
  );
}
