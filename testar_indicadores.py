def testar_indicadores():
    print("Testando chamada direta do script de indicadores...")
    import yfinance as yf
    import urllib.request
    import json

    # Teste Yfinance
    print("\nConsultando Dólar (USDBRL=X) e Ibovespa (^BVSP)...")
    for ticker in ["USDBRL=X", "^BVSP"]:
        t = yf.Ticker(ticker)
        history = t.history(period="1d")
        if not history.empty:
            print(f"- {ticker}: {float(history['Close'].iloc[-1]):.2f}")
        else:
            print(f"- {ticker}: Erro ao obter valor")

    # Teste Banco Central
    print("\nConsultando Banco Central do Brasil...")
    try:
        url_selic = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        req = urllib.request.Request(url_selic, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"- Selic Meta: {res[0]['valor']}% (Data: {res[0]['data']})")
    except Exception as e:
        print(f"Erro BC Selic: {e}")

if __name__ == "__main__":
    testar_indicadores()
