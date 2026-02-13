import { Injectable, Logger } from '@nestjs/common';
import { LLMService, LLMMessage } from './llm.service';

@Injectable()
export class ChatbotService {
    private readonly logger = new Logger(ChatbotService.name);

    private readonly systemPrompt = `Você é um assistente de IA útil e amigável em um aplicativo de chat educacional chamado Toolzz.

Suas responsabilidades:
- Responder perguntas sobre programação, tecnologia e educação
- Ser conciso e claro (máximo 3 parágrafos)
- Usar linguagem amigável e profissional
- Fornecer exemplos quando apropriado
- Admitir quando não souber algo

Comandos disponíveis:
- /ask [pergunta] - Fazer uma pergunta
- /help - Mostrar ajuda
- /about - Informações sobre o Toolzz

Responda sempre em português do Brasil.`;

    constructor(private readonly llmService: LLMService) { }

    isBotCommand(message: string): boolean {
        return message.trim().startsWith('/');
    }

    async processCommand(message: string, userName: string): Promise<string> {
        const command = message.trim().toLowerCase();

        if (command === '/help' || command === '/ajuda') {
            return this.getHelpMessage();
        }

        if (command === '/about' || command === '/sobre') {
            return this.getAboutMessage();
        }

        if (command.startsWith('/ask ') || command.startsWith('/perguntar ')) {
            const question = message.substring(message.indexOf(' ') + 1);
            return await this.answerQuestion(question, userName);
        }

        if (command.startsWith('/explain ') || command.startsWith('/explicar ')) {
            const topic = message.substring(message.indexOf(' ') + 1);
            return await this.explainTopic(topic);
        }

        if (command.startsWith('/code ') || command.startsWith('/codigo ')) {
            const request = message.substring(message.indexOf(' ') + 1);
            return await this.generateCode(request);
        }

        return `❌ Comando desconhecido. Digite /help para ver os comandos disponíveis.`;
    }

    private async answerQuestion(question: string, userName: string): Promise<string> {
        if (!this.llmService.isAvailable()) {
            return '⚠️ O assistente de IA está temporariamente indisponível. Por favor, tente novamente mais tarde.';
        }

        try {
            const messages: LLMMessage[] = [
                {
                    role: 'user',
                    content: `${userName} perguntou: ${question}`,
                },
            ];

            const response = await this.llmService.generateResponse(
                messages,
                this.systemPrompt
            );

            this.logger.log(`AI response generated for user ${userName}`);

            return `🤖 **Assistente IA:**\n\n${response.content}`;
        } catch (error) {
            this.logger.error(`Error generating AI response: ${error.message}`);
            return '❌ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.';
        }
    }

    private async explainTopic(topic: string): Promise<string> {
        if (!this.llmService.isAvailable()) {
            return '⚠️ O assistente de IA está temporariamente indisponível.';
        }

        try {
            const messages: LLMMessage[] = [
                {
                    role: 'user',
                    content: `Explique de forma clara e concisa: ${topic}`,
                },
            ];

            const response = await this.llmService.generateResponse(
                messages,
                this.systemPrompt + '\n\nForneça uma explicação educacional e didática.'
            );

            return `📚 **Explicação:**\n\n${response.content}`;
        } catch (error) {
            this.logger.error(`Error explaining topic: ${error.message}`);
            return '❌ Erro ao gerar explicação.';
        }
    }

    private async generateCode(request: string): Promise<string> {
        if (!this.llmService.isAvailable()) {
            return '⚠️ O assistente de IA está temporariamente indisponível.';
        }

        try {
            const messages: LLMMessage[] = [
                {
                    role: 'user',
                    content: `Gere um exemplo de código para: ${request}`,
                },
            ];

            const response = await this.llmService.generateResponse(
                messages,
                this.systemPrompt + '\n\nForneça código limpo, comentado e com boas práticas.'
            );

            return `💻 **Exemplo de Código:**\n\n${response.content}`;
        } catch (error) {
            this.logger.error(`Error generating code: ${error.message}`);
            return '❌ Erro ao gerar código.';
        }
    }

    private getHelpMessage(): string {
        return `🤖 **Comandos do Assistente IA:**

**Perguntas:**
• \`/ask [pergunta]\` - Fazer uma pergunta
• \`/explain [tópico]\` - Explicar um conceito
• \`/code [descrição]\` - Gerar exemplo de código

**Informações:**
• \`/help\` - Mostrar esta ajuda
• \`/about\` - Sobre o Toolzz

**Exemplos:**
• \`/ask Como funciona autenticação JWT?\`
• \`/explain async/await em JavaScript\`
• \`/code função para validar email\`

💡 **Dica:** O assistente responde em português e é especializado em programação e tecnologia!`;
    }

    private getAboutMessage(): string {
        return `ℹ️ **Sobre o Toolzz Chat**

**Versão:** 1.0.0
**Tecnologias:**
• Backend: NestJS + Socket.IO
• Frontend: Next.js + React
• Database: PostgreSQL + Prisma
• IA: OpenAI / Anthropic / Gemini

**Recursos:**
✅ Chat em tempo real
✅ Autenticação OAuth2 + 2FA
✅ Assistente IA integrado
✅ Modo escuro
✅ Testes automatizados

**Desenvolvido com ❤️ pela equipe Toolzz**`;
    }

    getAutoResponse(message: string): string | null {
        const lowerMessage = message.toLowerCase().trim();

        if (['oi', 'olá', 'ola', 'hey', 'hi', 'hello'].includes(lowerMessage)) {
            return '👋 Olá! Como posso ajudar? Digite /help para ver os comandos disponíveis.';
        }

        if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
            return '😊 Por nada! Estou aqui para ajudar!';
        }

        if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
            return this.getHelpMessage();
        }

        return null;
    }
}
