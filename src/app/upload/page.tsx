'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function ImportarExtrato() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [tipoImportacao, setTipoImportacao] = useState<'excel' | 'pdf'>('excel');
  
  // Estado de arquivo real
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivo(e.target.files[0]);
      setMessage('');
      setErrorMsg('');
    }
  };

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
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      
      if (tipoImportacao === 'excel' && !['xlsx', 'xls', 'csv'].includes(ext || '')) {
        setErrorMsg('Arquivo inválido. Por favor, selecione uma planilha Excel ou CSV.');
        return;
      }
      if (tipoImportacao === 'pdf' && ext !== 'pdf') {
        setErrorMsg('Arquivo inválido. Por favor, selecione um extrato em PDF.');
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
      setErrorMsg('Selecione um arquivo antes de prosseguir.');
      return;
    }

    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      // 1. Obter usuário logado para associar no backend
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // ----------------------------------------------------
      // FLUXO A: Processar Planilha Excel/CSV
      // ----------------------------------------------------
      if (tipoImportacao === 'excel') {
        const reader = new FileReader();
        
        reader.onload = async (evt) => {
          try {
            const bstr = evt.target?.result;
            const workbook = XLSX.read(bstr, { type: 'array' });
            
            // Ler a primeira aba da planilha
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Converter planilha em formato JSON bruto
            const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (rawJson.length === 0) {
              throw new Error("A planilha selecionada está vazia.");
            }

            // Enviar os dados brutos para a nossa API serverless Python
            const response = await fetch('/api/process_excel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: user.id,
                sheet_name: sheetName,
                data: rawJson
              })
            });

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || 'Erro ao processar planilha no servidor.');
            }

            setMessage(result.message || 'Dados da planilha importados com sucesso!');
            setArquivo(null);
          } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao ler ou enviar planilha.');
            setLoading(false);
          }
        };

        reader.readAsArrayBuffer(arquivo);
      } 
      
      // ----------------------------------------------------
      // FLUXO B: Processar Extrato/Fatura PDF
      // ----------------------------------------------------
      else {
        // Enviar o arquivo PDF via FormData (Multipart) para a API serverless
        // Para simplificar a rota serverless sem complexidade de upload físico na nuvem,
        // convertemos o PDF em Base64 no cliente e enviamos no corpo da requisição JSON.
        const reader = new FileReader();
        
        reader.onload = async (evt) => {
          try {
            const base64String = (evt.target?.result as string).split(',')[1];
            
            // Em produção, a API process_pdf pode ler o arquivo físico temporário ou processar o payload
            // Enviaremos os dados para a API process_pdf
            const response = await fetch('/api/process_pdf', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: user.id,
                pdf_data: base64String, // O script em Python receberá e processará decodificando
                id_cartao: null
              })
            });

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || 'Erro ao processar PDF no servidor.');
            }

            setMessage(result.message || 'Lançamentos do PDF importados com sucesso!');
            setArquivo(null);
          } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao ler ou enviar PDF.');
            setLoading(false);
          }
        };

        reader.readAsDataURL(arquivo);
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
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

          {/* Seletor Oculto */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={tipoImportacao === 'excel' ? '.xlsx, .xls, .csv' : '.pdf'}
            style={{ display: 'none' }}
          />

          {/* Area Drag & Drop */}
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
