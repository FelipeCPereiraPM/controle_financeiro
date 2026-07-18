import type { Metadata } from "next";
import "./index.css";
import Sidebar from "@/components/layout/sidebar";
import MarketHeader from "@/components/layout/market-header";

export const metadata: Metadata = {
  title: "ControleFI - Gestão Financeira Premium",
  description: "Seu controle financeiro pessoal avançado, integrado com Supabase e leitura automática de faturas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-container">
          <Sidebar />
          {/* Container flexível vertical para empilhar o header macro e a área de conteúdo */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flexGrow: 1, 
            height: '100vh', 
            overflow: 'hidden',
            minWidth: 0, // CRÍTICO: Impede que filhos largos estiquem este container
            width: '100%'
          }}>

            <MarketHeader />
            <main className="main-content" style={{ overflowY: 'auto', flexGrow: 1 }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
