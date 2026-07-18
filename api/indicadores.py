import json
import urllib.request
import yfinance as yf
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 1. Obter Dólar e Ibovespa via yfinance
            tickers = {
                "dolar": "USDBRL=X",
                "ibovespa": "^BVSP"
            }
            
            dados_mercado = {}
            for chave, ticker in tickers.items():
                t = yf.Ticker(ticker)
                # Obter cotação atual
                history = t.history(period="1d")
                if not history.empty:
                    cotacao = float(history['Close'].iloc[-1])
                else:
                    cotacao = 0.0
                
                # Variação diária simplificada
                history_5d = t.history(period="5d")
                variacao = 0.0
                if len(history_5d) >= 2:
                    fechamento_anterior = float(history_5d['Close'].iloc[-2])
                    if fechamento_anterior > 0:
                        variacao = ((cotacao - fechamento_anterior) / fechamento_anterior) * 100
                
                dados_mercado[chave] = {
                    "valor": cotacao,
                    "variacao": round(variacao, 2)
                }

            # 2. Obter Selic e IPCA via API pública do Banco Central do Brasil (SGS)
            # Selic Meta anualizada (série 432) e IPCA acumulado 12 meses (série 13522 ou IPCA mensal série 433)
            dados_macro = {
                "selic": 10.50, # Fallbacks caso a API do BC esteja instável
                "ipca": 4.20
            }

            try:
                # Buscar Selic (Meta) - Último valor da série 432
                url_selic = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
                req_selic = urllib.request.Request(url_selic, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_selic, timeout=5) as response:
                    res_json = json.loads(response.read().decode('utf-8'))
                    if res_json:
                        dados_macro["selic"] = float(res_json[0]["valor"])
            except Exception as e:
                print(f"Erro ao buscar Selic: {e}")

            try:
                # Buscar IPCA acumulado nos últimos 12 meses (série 13522)
                url_ipca = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json"
                req_ipca = urllib.request.Request(url_ipca, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_ipca, timeout=5) as response:
                    res_json = json.loads(response.read().decode('utf-8'))
                    if res_json:
                        dados_macro["ipca"] = float(res_json[0]["valor"])
            except Exception as e:
                print(f"Erro ao buscar IPCA: {e}")

            # Responder JSON consolidado
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "dolar": dados_mercado["dolar"],
                "ibovespa": dados_mercado["ibovespa"],
                "selic": {
                    "valor": dados_macro["selic"],
                    "nome": "Taxa Selic"
                },
                "ipca": {
                    "valor": dados_macro["ipca"],
                    "nome": "IPCA (12m)"
                }
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
