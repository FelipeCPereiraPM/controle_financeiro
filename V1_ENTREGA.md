# Relatório de Entrega - Versão 1.0 (ControleFI)

Este documento resume a arquitetura, funcionalidades entregues e as etapas para deploy e publicação do aplicativo na Vercel.

---

## 🏗️ Estrutura do Sistema

```mermaid
graph TD
    User([Usuário]) -->|Next.js Frontend / CSS Vanilla| App[ControleFI Web App]
    App -->|Upload de Excel/PDF| API[Vercel Serverless Python Functions]
    API -->|Pandas & Regex| Process[Processamento & Normalização]
    API -->|yfinance & BC API| Market[Cotações & Índices de Mercado]
    Process -->|Persistência em Lote| DB[(Supabase PostgreSQL)]
    App -->|Queries Diretas via JS Client| DB
```

---

## 🚀 Funcionalidades Entregues na V1

1. **Infraestrutura de Banco de Dados:**
   - PostgreSQL hospedado gratuitamente no Supabase na região do Brasil (`sa-east-1` - São Paulo).
   - Tabelas estruturadas: `transacoes`, `categorias`, `contas` e `cartoes_credito` com fuso horário do Brasil configurado.
   - Banco pré-populado com categorias financeiras padrão em cores (Investimento, Lazer, Transporte, etc.).

2. **Core Backend - Processamento em Python:**
   - Endpoint de importação de planilhas (`/api/process_excel.py`) usando o Pandas para normalizar datas, valores (valores absolutos positivos) e persistir em lote.
   - Endpoint de importação de faturas PDF (`/api/process_pdf.py`) que usa Regex Multiline para extrair dados estruturados de compras e estornos, mesmo com quebras de linha no PDF.
   - Endpoints de mercado (`/api/dividendos.py` e `/api/indicadores.py`) para puxar cotações em tempo real de ações/FIIs (Yahoo Finance) e indicadores econômicos (Selic/IPCA diretamente do Banco Central).

3. **Frontend Premium (Estilo Investidor10):**
   - **Dashboard Principal:** Cards consolidados de receitas, despesas e saldo geral, com gráficos dinâmicos de fluxo de caixa e pizza (divisão de despesas).
   - **Página de Investimentos:** Painel com rentabilidade, distribuição de carteira e a tabela de **Histórico Mensal de Proventos** (exibindo colunas de jan-dez, média mensal e total anual).
   - **Barra de Indicadores Ampliada:** Painel superior no topo do app exibindo cotação do Dólar, Ibovespa, Selic e IPCA em tempo real.
   - **Conversor USD/BRL Integrado:** Calculadora de conversão de câmbio localizada ao lado do subtítulo de investimentos.
   - **Menu Lateral Colapsável:** Sidebar de navegação fina com destaque da rota ativa e capacidade de minimizar para otimizar espaço de tela.
   - **Suporte a Temas (Light & Dark):** Alternador no topo com persistência no `localStorage`.

---

## 🛠️ Passo a Passo para Deploy na Vercel

Siga estas etapas para colocar seu aplicativo no ar em menos de 5 minutos:

### Passo 1: Subir o Projeto para o GitHub
1. Inicialize o repositório git na pasta `d:\Controle_Financeiro\`:
   ```bash
   git init
   git add .
   git commit -m "feat: release v1.0 controle financeiro"
   ```
2. Crie um repositório (público ou privado) no seu GitHub.
3. Vincule e envie o código:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

### Passo 2: Importar o Projeto na Vercel
1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard) e faça login com seu GitHub.
2. Clique em **Add New...** -> **Project**.
3. Importe o repositório que acabou de criar.

### Passo 3: Configurar as Variáveis de Ambiente
Antes de clicar em **Deploy**, expanda a seção **Environment Variables** e adicione as duas chaves que estão no seu arquivo `.env.local`:

1. **Nome:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Valor:** `https://uayfootdhoqbbwakvhhw.supabase.co`
2. **Nome:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheWZvb3RkaG9xYmJ3YWt2aGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDc2NTEsImV4cCI6MjA5OTg4MzY1MX0.85V73jtKpsHEpY3Msvg5uHY3ZKOerKmZzi06YS3j5fI`

### Passo 4: Finalizar Deploy
1. Clique em **Deploy**.
2. A Vercel detectará que o projeto é Next.js, configurará o build do frontend e compilará as APIs Python da pasta `/api` usando as dependências declaradas no `requirements.txt`.
3. Em cerca de 1 a 2 minutos, seu link de produção estará ativo e pronto!
