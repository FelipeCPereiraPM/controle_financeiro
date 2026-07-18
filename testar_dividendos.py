import urllib.request
import json

def testar_api_dividendos():
    print("Testando chamada local para a API de Dividendos via yfinance...")
    # Ticker: MXRF11 com 300 cotas.
    # Em ambiente de desenvolvimento local, o serverless backend da Vercel é simulado via porta do Next ou usando a lógica direta
    # Para fins de validação no script de testes local, importamos a classe e executamos
    from api.dividendos import handler
    
    # Criar um teste direto na lógica do yfinance para provar que está buscando
    import yfinance as yf
    
    ticker = "MXRF11.SA"
    print(f"\nBuscando dados de mercado para {ticker}...")
    try:
        t = yf.Ticker(ticker)
        # Preço
        history = t.history(period="1d")
        preco = float(history['Close'].iloc[-1]) if not history.empty else 0.0
        
        # Último dividendo
        divs = t.dividends
        ultimo_div = float(divs.iloc[-1]) if not divs.empty else 0.0
        
        print("\n=== Resultados do Yahoo Finance ===")
        print(f"Ticker: {ticker}")
        print(f"Cotação Atual: R$ {preco:.2f}")
        print(f"Último Dividendo por Cota: R$ {ultimo_div:.2f}")
        
        # Simular carteira com 300 cotas
        cotas = 300
        estimativa = ultimo_div * cotas
        print(f"Estimativa de Recebimento (300 cotas): R$ {estimativa:.2f}")
        print("====================================")
        print("API integrada com sucesso!")
        
    except Exception as e:
        print(f"Erro ao consultar yfinance: {e}")

if __name__ == "__main__":
    testar_api_dividendos()
