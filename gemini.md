# Controle Financeiro - Estrutura do Projeto

Este documento detalha a estrutura de diretórios do projeto de controle financeiro baseado em Next.js com processamento de arquivos em Python e persistência no Supabase.

## Estrutura de Diretórios

```
d:\Controle_Financeiro\
├── .env.example             # Exemplo de variáveis de ambiente (Supabase credentials)
├── requirements.txt         # Dependências Python para os parsers (pandas, openpyxl, pypdf, etc.)
├── package.json             # Dependências Node.js
├── next.config.js           # Configurações do Next.js
├── tailwind.config.js       # Opcional (CSS Vanilla é priorizado em index.css)
│
├── api/                     # Serverless Functions em Python (Mapeadas pela Vercel)
│   ├── process_pdf.py       # Parser de extratos/faturas PDF com Regex estruturado
│   ├── process_excel.py     # Parser de planilhas Excel/CSV com Pandas
│   └── utils/
│       └── db_client.py     # Helper para enviar os dados processados para o Supabase
│
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Layout global da aplicação
│   ├── page.tsx             # Página inicial (Dashboard de Insights)
│   ├── index.css            # Estilos globais e tokens de design (CSS Vanilla)
│   ├── transacoes/
│   │   └── page.tsx         # Tela de listagem e inserção manual
│   └── upload/
│       └── page.tsx         # Tela de upload de arquivos (PDF e planilhas)
│
├── components/              # Componentes React reutilizáveis
│   ├── ui/
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   └── file-upload.tsx
│   └── layout/
│       └── sidebar.tsx
│
└── lib/                     # Utilitários do sistema e cliente do Supabase
    ├── supabase.ts          # Inicialização do cliente Supabase
    └── format.ts            # Funções helpers para formatação de valores e datas
```
