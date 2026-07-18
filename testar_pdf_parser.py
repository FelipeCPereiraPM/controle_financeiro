import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env.local antes do cliente de DB
load_dotenv(dotenv_path='.env.local')

import pypdf
import re
from api.utils.db_client import db

def testar_parser_pdf():
    print("Iniciando teste de parser de PDF...")
    pdf_path = "fatura_teste.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Erro: Arquivo {pdf_path} não encontrado!")
        return

    # 1. Extrair texto do PDF
    extracted_text = ""
    with open(pdf_path, 'rb') as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

    print("\n--- Texto bruto extraído do PDF ---")
    print(extracted_text)
    print("-----------------------------------")

    # 2. Expressão Regular para o padrão de fatura (suportando quebras de linha \n)
    # Busca: [Data] -> [\n ou espaço] -> [Descrição] -> [\n ou espaço] -> R$ -> [\n ou espaço] -> [Valor]
    pattern = re.compile(
        r'(\d{2}/\d{2}/\d{4})\s*\n?\s*([\w\s\*.*?]+?)\s*\n?\s*R\$\s*(-?[\d\.]+,\d{2}|-?\d+,\d{2})',
        re.MULTILINE
    )
    
    transactions = []
    
    # Buscar todas as ocorrências no texto completo do PDF
    for match in pattern.finditer(extracted_text):
        date_str, desc, value_str = match.groups()
        
        # Ignorar textos espúrios que podem parecer transações mas são cabeçalhos
        if "Vencimento" in desc or "Limite" in desc or "Total" in desc:
            continue
            
        # Formatar a data de DD/MM/AAAA para YYYY-MM-DD
        day, month, year = date_str.split('/')
        formatted_date = f"{year}-{month}-{day}"
        
        # Limpar o valor: remover ponto de milhar e trocar vírgula por ponto
        value_cleaned = value_str.replace('.', '').replace(',', '.')
        value = float(value_cleaned)
        
        # Definir se é entrada ou saída
        tipo = 'ENTRADA' if value > 0 else 'SAIDA'
        
        transactions.append({
            "data": formatted_date,
            "descricao": desc.strip().replace('\n', ' '), # Junta descrições quebradas
            "valor": abs(value), # Banco guarda valor absoluto positivo
            "tipo": tipo,
            "status": "PENDENTE"
        })


    if not transactions:
        print("\nNenhuma transação foi detectada pelo Regex!")
        return

    print(f"\nTransações identificadas e normalizadas ({len(transactions)}):")
    for t in transactions:
        print(f"- {t['data']} | {t['descricao']} | R$ {t['valor']} ({t['tipo']})")

    # 3. Garantir um cartão de crédito de teste no banco para associar
    cartoes_res = db.table("cartoes_credito").select("id").limit(1).execute()
    if cartoes_res.data:
        id_cartao = cartoes_res.data[0]['id']
    else:
        # Se não houver cartões, precisamos de uma conta vinculada primeiro
        contas_res = db.table("contas").select("id").limit(1).execute()
        if contas_res.data:
            id_conta = contas_res.data[0]['id']
        else:
            nova_conta = {
                "nome": "Carteira de Teste",
                "tipo": "CARTEIRA",
                "saldo_inicial": 0.00
            }
            conta_criada = db.table("contas").insert(nova_conta).execute()
            id_conta = conta_criada.data[0]['id']

        # Criar cartão
        print("\nNenhum cartão encontrado. Criando 'Cartão de Teste'...")
        novo_cartao = {
            "nome": "Cartão Visa Teste",
            "limite": 5000.00,
            "dia_fechamento": 28,
            "dia_vencimento": 5,
            "id_conta_vinculada": id_conta
        }
        cartao_criado = db.table("cartoes_credito").insert(novo_cartao).execute()
        id_cartao = cartao_criado.data[0]['id']
        print(f"Cartão criado com ID: {id_cartao}")

    # Associar transações ao cartão
    for t in transactions:
        t['id_cartao'] = id_cartao

    # 4. Inserir no Supabase
    print(f"\nInjetando as transações do PDF no Supabase...")
    try:
        result = db.table("transacoes").insert(transactions).execute()
        print("Sucesso! Lançamentos salvos no banco de dados.")
    except Exception as e:
        print(f"Erro ao salvar no banco de dados: {e}")

if __name__ == "__main__":
    testar_parser_pdf()
