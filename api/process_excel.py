import os
import json
import pandas as pd
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from api.utils.db_client import db

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Obter o tamanho do corpo da requisição
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # NOTA: Em produção, o arquivo virá como multipart/form-data.
            # Aqui estruturamos a leitura básica do DataFrame assumindo envio JSON
            # ou bytes de planilha. Para simplificar e testar a lógica do Pandas:
            payload = json.loads(post_data.decode('utf-8'))
            rows = payload.get("data", [])
            id_conta = payload.get("id_conta")
            id_cartao = payload.get("id_cartao")
            
            if not rows:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Nenhum dado enviado"}).encode())
                return
                
            # Converter para DataFrame do Pandas para normalização
            df = pd.DataFrame(rows)
            
            # Garantir colunas obrigatórias mapeadas (data, descricao, valor)
            # Mapeamento esperado no JSON: { "data": "YYYY-MM-DD", "descricao": "...", "valor": 100.00 }
            required_cols = {'data', 'descricao', 'valor'}
            if not required_cols.issubset(df.columns):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Colunas obrigatórias ausentes. Requerido: {required_cols}"}).encode())
                return

            # Normalização usando Pandas
            df['data'] = pd.to_datetime(df['data']).dt.strftime('%Y-%m-%d')
            df['valor'] = pd.to_numeric(df['valor'])
            df['tipo'] = df['valor'].apply(lambda x: 'ENTRADA' if x > 0 else 'SAIDA')
            df['valor'] = df['valor'].abs() # Gravar sempre valor absoluto positivo no banco
            df['status'] = 'EFETIVADO'
            
            # Adicionar chaves estrangeiras de conta ou cartão
            if id_conta:
                df['id_conta'] = id_conta
            if id_cartao:
                df['id_cartao'] = id_cartao

            # Converter de volta para dicionário para inserção em lote no Supabase
            transactions_to_insert = df.to_dict(orient='records')
            
            # Inserir no Supabase usando o client
            result = db.table("transacoes").insert(transactions_to_insert).execute()
            
            # Responder com sucesso
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "message": f"{len(transactions_to_insert)} transações processadas e salvas com sucesso!",
                "data": result.data
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
