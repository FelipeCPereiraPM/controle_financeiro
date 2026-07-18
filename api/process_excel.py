import os
import json
import pandas as pd
from http.server import BaseHTTPRequestHandler
from api.utils.db_client import db

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Obter o tamanho do corpo da requisição
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Nota: Em produção, o arquivo virá como multipart/form-data ou bytes da planilha.
            # Para testar a lógica flexível com os dados do frontend e o arquivo enviado:
            payload = json.loads(post_data.decode('utf-8'))
            rows = payload.get("data", [])
            id_usuario = payload.get("user_id")
            nome_aba = payload.get("sheet_name", "Controle26") # Ex: Controle25, Controle26 para inferir ano
            
            if not rows:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Nenhum dado de planilha enviado."}).encode())
                return
                
            # Converter para DataFrame do Pandas para análise estrutural
            df_raw = pd.DataFrame(rows)

            # Extrair ano da aba (Ex: Controle25 -> 2025, Controle26 -> 2026)
            ano_referencia = 2026
            import re
            match_ano = re.search(r'\d{2,4}', nome_aba)
            if match_ano:
                ano_str = match_ano.group()
                ano_referencia = int(f"20{ano_str}" if len(ano_str) == 2 else ano_str)

            transactions_to_insert = []

            # -------------------------------------------------------------------------
            # MODO 1: Matriz de Orçamento Horizontal (Janeiro, Fevereiro, Março...)
            # -------------------------------------------------------------------------
            colunas_meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                             'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
            
            # Verifica se há colunas de meses na planilha
            meses_presentes = [col for col in colunas_meses if col in df_raw.columns]
            
            if len(meses_presentes) > 0:
                # O primeiro campo geralmente é a descrição da linha (Receitas/Despesas)
                coluna_descricao = df_raw.columns[0]
                
                # Mapeamento de nome de mês para índice 1-12
                meses_map = {
                    'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
                    'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
                }

                for _, row in df_raw.iterrows():
                    descricao_linha = str(row[coluna_descricao]).strip()
                    
                    # Pular linhas de totais ou vazias para não sujar o banco
                    if not descricao_linha or descricao_linha.upper() in ['TOTAL', '% SOBRE RECEITA', 'RECEITAS/DESPESAS', 'DESPESA', 'RECEITA', 'NAN']:
                        continue
                    
                    # Identificar categoria baseado na descrição da linha
                    tipo = 'SAIDA'
                    if descricao_linha.lower() in ['salário', 'adiantamento', '13º salário', 'férias', 'rendimentos']:
                        tipo = 'ENTRADA'

                    for mes_nome in meses_presentes:
                        valor_celula = row[mes_nome]
                        
                        # Tratar valores vazios, hífens ou nulos da célula
                        if pd.isna(valor_celula) or valor_celula in ['', '-', 'R$ 0,00', '0', 0, 0.0]:
                            continue
                            
                        # Limpeza de formato financeiro R$
                        if isinstance(valor_celula, str):
                            valor_celula = valor_celula.replace('R$', '').replace('.', '').replace(',', '.').strip()
                        
                        try:
                            valor_final = abs(float(valor_celula))
                            if valor_final == 0:
                                continue
                        except ValueError:
                            continue

                        # Gerar data da transação (Ex: 01/01/2026)
                        num_mes = meses_map[mes_nome]
                        data_transacao = f"{ano_referencia}-{str(num_mes).zfill(2)}-01"


                        transactions_to_insert.append({
                            "data": data_transacao,
                            "descricao": f"Planilha: {descricao_linha}",
                            "valor": valor_final,
                            "tipo": tipo,
                            "status": "EFETIVADO",
                            "user_id": id_usuario
                        })

            # -------------------------------------------------------------------------
            # MODO 2: Lista Tradicional Vertical de Transações (colunas: data, valor...)
            # -------------------------------------------------------------------------
            else:
                required_cols = {'data', 'descricao', 'valor'}
                if not required_cols.issubset(df_raw.columns):
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Planilha não identificada como Orçamento e colunas de Extrato ausentes."}).encode())
                    return

                # Normalização de extrato tradicional
                df_raw['data'] = pd.to_datetime(df_raw['data']).dt.strftime('%Y-%m-%d')
                df_raw['valor'] = pd.to_numeric(df_raw['valor'])
                
                for _, row in df_raw.iterrows():
                    val = float(row['valor'])
                    tipo = 'ENTRADA' if val > 0 else 'SAIDA'
                    transactions_to_insert.append({
                        "data": row['data'],
                        "descricao": str(row['descricao']).strip(),
                        "valor": abs(val),
                        "tipo": tipo,
                        "status": "EFETIVADO",
                        "user_id": id_usuario
                    })

            if not transactions_to_insert:
                self.send_response(422)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Nenhum lançamento válido foi identificado no arquivo."}).encode())
                return

            # Inserir registros no Supabase
            result = db.table("transacoes").insert(transactions_to_insert).execute()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "message": f"Sucesso! {len(transactions_to_insert)} lançamentos importados e salvos.",
                "data": result.data
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
