import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env.local antes de importar o cliente do banco
load_dotenv(dotenv_path='.env.local')

import pandas as pd
from api.utils.db_client import db


def testar_importacao_excel():
    print("Iniciando teste de parser de Excel com Pandas...")
    excel_path = "transacoes_teste.xlsx"
    
    if not os.path.exists(excel_path):
        print(f"Erro: Arquivo {excel_path} não encontrado!")
        return

    # 1. Simular o processamento com Pandas conforme implementado na API
    df = pd.read_excel(excel_path)
    print("\nDados originais da planilha:")
    print(df)
    
    # Aplicar normalizações
    df['data'] = pd.to_datetime(df['data']).dt.strftime('%Y-%m-%d')
    df['valor'] = pd.to_numeric(df['valor'])
    df['tipo'] = df['valor'].apply(lambda x: 'ENTRADA' if x > 0 else 'SAIDA')
    df['valor'] = df['valor'].abs()
    df['status'] = 'EFETIVADO'
    
    print("\nDados normalizados pelo Pandas:")
    print(df)
    
    # 2. Obter ou criar uma conta de teste no banco para associar às transações
    # Buscar contas existentes
    contas_res = db.table("contas").select("id").limit(1).execute()
    if contas_res.data:
        id_conta = contas_res.data[0]['id']
    else:
        # Se não houver contas, cria uma conta padrão
        print("\nNenhuma conta encontrada no banco. Criando conta 'Carteira de Teste'...")
        nova_conta = {
            "nome": "Carteira de Teste",
            "tipo": "CARTEIRA",
            "saldo_inicial": 0.00
        }
        conta_criada = db.table("contas").insert(nova_conta).execute()
        id_conta = conta_criada.data[0]['id']
        print(f"Conta criada com ID: {id_conta}")
        
    df['id_conta'] = id_conta

    # Converter para dicionário para inserção no banco
    transactions_to_insert = df.to_dict(orient='records')
    
    # 3. Enviar ao Supabase
    print(f"\nEnviando {len(transactions_to_insert)} transações para o Supabase...")
    try:
        result = db.table("transacoes").insert(transactions_to_insert).execute()
        print("Sucesso! Transações inseridas no banco:")
        for t in result.data:
            print(f"- {t['data']} | {t['descricao']} | R$ {t['valor']} ({t['tipo']})")
    except Exception as e:
        print(f"Erro ao inserir no banco: {e}")

if __name__ == "__main__":
    testar_importacao_excel()
