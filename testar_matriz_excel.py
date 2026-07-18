import os
from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

import pandas as pd


def testar_processamento_matriz():
    print("Simulando execução do parser de Excel com estrutura de Matriz Horizontal...")
    
    # 1. Mock de dados simulando a leitura exata do XLSX enviado
    matriz_teste = [
        {"Receitas/Despesas": "Salário", "Janeiro": "R$ 3.320,41", "Fevereiro": "R$ 3.771,15", "Março": "R$ 3.771,15", "Abril": "R$ 4.299,55"},
        {"Receitas/Despesas": "Adiantamento", "Janeiro": "R$ 2.315,88", "Fevereiro": "R$ 2.199,63", "Março": "-", "Abril": "R$ 2.152,94"},
        {"Receitas/Despesas": "FIIs", "Janeiro": "R$ 678,16", "Fevereiro": "R$ 191,15", "Março": "R$ 772,22", "Abril": "R$ 243,10"},
        {"Receitas/Despesas": "Total", "Janeiro": "R$ 5.726,29", "Fevereiro": "R$ 5.970,78", "Março": "R$ 6.733,13", "Abril": "R$ 6.452,49"}
    ]
    
    df = pd.DataFrame(matriz_teste)
    print("\n--- Dados Simulado lidos da Matriz Orçamentária ---")
    print(df)
    
    # Executar a normalização lógica do Pandas integrada no process_excel.py
    colunas_meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    
    meses_presentes = [col for col in colunas_meses if col in df.columns]
    coluna_descricao = df.columns[0]
    
    meses_map = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
        'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    }
    
    transacoes_processadas = []
    
    for _, row in df.iterrows():
        desc = str(row[coluna_descricao]).strip()
        if not desc or desc.upper() in ['TOTAL', '% SOBRE RECEITA', 'RECEITAS/DESPESAS', 'DESPESA', 'RECEITA']:
            continue
            
        tipo = 'SAIDA'
        if desc.lower() in ['salário', 'adiantamento', 'férias', 'fiis', 'rendimentos']:
            tipo = 'ENTRADA'
            
        for mes_nome in meses_presentes:
            val = row[mes_nome]
            if pd.isna(val) or val in ['', '-', 'R$ 0,00', '0', 0, 0.0]:
                continue
                
            if isinstance(val, str):
                val = val.replace('R$', '').replace('.', '').replace(',', '.').strip()
            
            valor_final = abs(float(val))
            
            # Gerar data da transação (Ex: 01/01/2026)
            num_mes = meses_map[mes_nome]
            data_str = f"2026-{str(num_mes).zfill(2)}-01"

            
            transacoes_processadas.append({
                "data": data_str,
                "descricao": f"Planilha: {desc}",
                "valor": valor_final,
                "tipo": tipo
            })
            
    print("\n--- Transações Normalizadas Convertidas em Lista ---")
    for t in transacoes_processadas:
        print(f"- Data: {t['data']} | Desc: {t['descricao']} | Valor: R$ {t['valor']} | Tipo: {t['tipo']}")

if __name__ == "__main__":
    testar_processamento_matriz()
