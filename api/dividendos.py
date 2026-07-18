import os
import json
import yfinance as yf
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Obter os parâmetros de query string da URL (ex: ?ticker=MXRF11&qtd=300)
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            ticker = query_params.get("ticker", [None])[0]
            quantidade_str = query_params.get("qtd", ["0"])[0]
            quantidade = float(quantidade_str)

            if not ticker:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Parâmetro 'ticker' é obrigatório."}).encode())
                return

            # Adicionar sufixo brasileiro caso não tenha
            ticker_br = ticker.upper()
            if not ticker_br.endswith(".SA"):
                ticker_br = f"{ticker_br}.SA"

            # Buscar dados usando Yahoo Finance
            ticker_obj = yf.Ticker(ticker_br)
            
            # 1. Cotação Atual
            # yfinance armazena o preço mais recente no info
            info = ticker_obj.info
            cotacao_atual = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")

            # Fallback se yfinance falhar em trazer preço em tempo de execução
            if not cotacao_atual:
                history = ticker_obj.history(period="1d")
                if not history.empty:
                    cotacao_atual = float(history['Close'].iloc[-1])
                else:
                    cotacao_atual = 0.0

            # 2. Rendimento (Dividendo) Pago Recente
            # yfinance disponibiliza o histórico de dividendos em um Pandas Series
            dividends = ticker_obj.dividends
            ultimo_dividendo_cota = 0.0
            estimativa_provento_total = 0.0

            if not dividends.empty:
                # Obter o último dividendo pago por cota
                ultimo_dividendo_cota = float(dividends.iloc[-1])
                estimativa_provento_total = ultimo_dividendo_cota * quantidade

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "ticker": ticker.upper(),
                "cotacao_atual": cotacao_atual,
                "ultimo_dividendo_cota": ultimo_dividendo_cota,
                "quantidade": quantidade,
                "estimativa_recebimento": estimativa_provento_total
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
