import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    model: string;
    tokensUsed?: number;
}

@Injectable()
export class LLMService {
    private readonly logger = new Logger(LLMService.name);
    private readonly apiKey: string;
    private readonly provider: 'openai' | 'anthropic' | 'gemini';
    private readonly model: string;

    constructor(private configService: ConfigService) {
        this.provider = this.configService.get('LLM_PROVIDER', 'openai') as any;
        this.apiKey = this.configService.get('LLM_API_KEY', '');

        // Default models for each provider
        const defaultModels = {
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-haiku-20240307',
            gemini: 'gemini-1.5-flash',
        };

        this.model = this.configService.get('LLM_MODEL', defaultModels[this.provider]);
    }

    /**
     * Generate a response from the LLM
     * @param messages - Conversation history
     * @param systemPrompt - System instructions (optional)
     * @returns LLM response
     */
    async generateResponse(
        messages: LLMMessage[],
        systemPrompt?: string
    ): Promise<LLMResponse> {
        if (!this.apiKey) {
            this.logger.warn('LLM API key not configured, returning fallback response');
            return this.getFallbackResponse();
        }

        try {
            switch (this.provider) {
                case 'openai':
                    return await this.callOpenAI(messages, systemPrompt);
                case 'anthropic':
                    return await this.callAnthropic(messages, systemPrompt);
                case 'gemini':
                    return await this.callGemini(messages, systemPrompt);
                default:
                    throw new Error(`Unsupported LLM provider: ${this.provider}`);
            }
        } catch (error) {
            this.logger.error(`LLM API error: ${error.message}`, error.stack);
            return this.getFallbackResponse();
        }
    }

    /**
     * Call OpenAI API
     */
    private async callOpenAI(
        messages: LLMMessage[],
        systemPrompt?: string
    ): Promise<LLMResponse> {
        const allMessages = systemPrompt
            ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
            : messages;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: allMessages,
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            model: this.model,
            tokensUsed: data.usage?.total_tokens,
        };
    }

    /**
     * Call Anthropic API
     */
    private async callAnthropic(
        messages: LLMMessage[],
        systemPrompt?: string
    ): Promise<LLMResponse> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 500,
                system: systemPrompt,
                messages: messages.filter(m => m.role !== 'system'),
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.content[0].text,
            model: this.model,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        };
    }

    /**
     * Call Google Gemini API
     */
    private async callGemini(
        messages: LLMMessage[],
        systemPrompt?: string
    ): Promise<LLMResponse> {
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            content: data.candidates[0].content.parts[0].text,
            model: this.model,
        };
    }

    /**
     * Fallback response when LLM is unavailable
     */
    private getFallbackResponse(): LLMResponse {
        return {
            content: 'Desculpe, o assistente de IA está temporariamente indisponível. Por favor, tente novamente mais tarde.',
            model: 'fallback',
        };
    }

    /**
     * Check if LLM is configured and available
     */
    isAvailable(): boolean {
        return !!this.apiKey;
    }
}
