import './global.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Teste Técnico Toolzz',
  description: 'Desafio Técnico Full Stack - NestJS + Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
