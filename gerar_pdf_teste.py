from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def criar_fatura_teste_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Cabeçalho da Fatura Simulada
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Fatura de Cartão de Crédito - Banco de Teste S.A.")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Cliente: Felipe C. Pereira | Vencimento: 10/08/2026")
    c.drawString(50, height - 85, "Limite Total: R$ 10.000,00 | Limite Disponível: R$ 8.520,30")
    
    c.setLineWidth(1)
    c.line(50, height - 95, width - 50, height - 95)

    # Corpo da Fatura - Lançamentos
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "Detalhamento da Fatura:")
    
    c.setFont("Helvetica", 10)
    y_pos = height - 145
    
    # Lista de compras simulando formato de fatura de bancos brasileiros
    compras = [
        ("12/07/2026", "SUPERMERCADO DIA BRASIL", "-189,40"),
        ("14/07/2026", "UBER *UBER *TRIP BRASIL", "-22,50"),
        ("15/07/2026", "POSTO IPIRANGA GNV", "-110,00"),
        ("18/07/2026", "AMAZON.COM.BR VAREJO", "-420,00"),
        ("20/07/2026", "IFEED*REST. DOCE SABOR", "-75,90"),
        ("22/07/2026", "ESTORNO COMPRA ANTERIOR", "150,00") # Crédito na fatura
    ]

    for data, desc, valor in compras:
        # Coluna 1: Data
        c.drawString(50, y_pos, data)
        # Coluna 2: Descrição da transação
        c.drawString(130, y_pos, desc)
        # Coluna 3: Valor (Alinhado à direita de forma aproximada)
        c.drawRightString(width - 50, y_pos, f"R$ {valor}")
        y_pos -= 20

    c.line(50, y_pos - 10, width - 50, y_pos - 10)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_pos - 30, "Total da Fatura Atual:")
    c.drawRightString(width - 50, y_pos - 30, "R$ 667,80")

    c.save()
    print(f"Fatura PDF realista gerada com sucesso em: {filename}")

if __name__ == "__main__":
    criar_fatura_teste_pdf("fatura_teste.pdf")
