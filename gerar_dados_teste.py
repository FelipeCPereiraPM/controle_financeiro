import pandas as pd

# Criar dados de transações de teste
data_teste = [
    {"data": "2026-07-10", "descricao": "Supermercado Pao de Acucar", "valor": -180.50},
    {"data": "2026-07-11", "descricao": "Posto Shell Combustivel", "valor": -90.00},
    {"data": "2026-07-12", "descricao": "Uber Viagem", "valor": -25.30},
    {"data": "2026-07-15", "descricao": "Salario Mensal", "valor": 5500.00},
    {"data": "2026-07-16", "descricao": "Rendimento Poupanca", "valor": 12.45}
]

df = pd.DataFrame(data_teste)

# Salvar como arquivo Excel
excel_path = "d:\\Controle_Financeiro\\transacoes_teste.xlsx"
df.to_excel(excel_path, index=False)
print(f"Planilha de teste gerada com sucesso em: {excel_path}")
