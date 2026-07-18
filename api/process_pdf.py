import os
import json
import re
from http.server import BaseHTTPRequestHandler
import pypdf
from api.utils.db_client import db

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Obter o tamanho do corpo da requisição
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Nota: Em produção o PDF será enviado via multipart/form-data.
            # Esta estrutura foca na lógica de leitura e parsing de texto do PDF
            # Para fins demonstrativos/base, assumimos o recebimento do arquivo ou texto extraído
            # Vamos simular a leitura do PDF usando pypdf a partir do payload recebido.
            payload = json.loads(post_data.decode('utf-8'))
            pdf_path = payload.get("pdf_path") # Ex: Se salvo temporariamente
            id_conta = payload.get("id_conta")
            id_cartao = payload.get("id_cartao")
            
            if not pdf_path or not os.path.exists(pdf_path):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Caminho do PDF inválido ou inexistente."}).encode())
                return
            
            # Extrair texto do PDF
            extracted_text = ""
            with open(pdf_path, 'rb') as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"
            
            # Regex genérico de transações financeiras (Data, Descrição e Valor)
            # Padrão comum: DD/MM/AAAA ou DD/MM descrição R$ X.XX ou -X.XX
            # Exemplo de linha do Nubank/Itaú: "15/07/2026 Supermercado Pão de Açúcar -154,20"
            pattern = re.compile(
                r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})\s+([\w\s\-.*?]+?)\s+(-?[\d\.]+,\d{2}|-?\d+,\d{2})'
            )
            
            transactions = []
            for line in extracted_text.split('\n'):
                match = pattern.search(line)
                if match:
                    date_str, desc, value_str = match.groups()
                    
                    # Tratar data (adicionar ano corrente caso seja apenas DD/MM)
                    if len(date_str) == 5:
                        date_str = f"{date_str}/2026" # Fixando ano corrente para o exemplo
                    
                    # Formatar data de DD/MM/AAAA para YYYY-MM-DD
                    day, month, year = date_str.split('/')
                    formatted_date = f"{year}-{month}-{day}"
                    
                    # Formatar valor (ex: -154,20 para -154.20)
                    value_cleaned = value_str.replace('.', '').replace(',', '.')
                    value = float(value_cleaned)
                    
                    tipo = 'ENTRADA' if value > 0 else 'SAIDA'
                    
                    transactions.append({
                        "data": formatted_date,
                        "descricao": desc.strip(),
                        "valor": abs(value),
                        "tipo": tipo,
                        "status": "EFETIVADO",
                        "id_conta": id_conta,
                        "id_cartao": id_cartao
                    })
            
            if not transactions:
                self.send_response(422)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Nenhuma transação padrão foi identificada no PDF."}).encode())
                return
                
            # Inserir transações processadas no Supabase
            result = db.table("transacoes").insert(transactions).execute()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "message": f"{len(transactions)} transações extraídas do PDF e salvas!",
                "data": result.data
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
