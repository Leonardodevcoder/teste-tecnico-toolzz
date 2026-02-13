import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
    connected: boolean;
    onSendMessage: (content: string) => void;
    onTyping: (isTyping: boolean) => void;
}

export function MessageInput({ connected, onSendMessage, onTyping }: MessageInputProps) {
    const [inputValue, setInputValue] = useState('');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        onTyping(true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        onSendMessage(inputValue);
        setInputValue('');

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        onTyping(false);
    };

    return (
        <footer className="bg-white dark:bg-gray-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] transition-colors duration-300">
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={connected ? 'Digite sua mensagem...' : 'Conectando...'}
                    disabled={!connected}
                    className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 disabled:opacity-50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!connected || !inputValue.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={20} />
                </button>
            </form>
        </footer>
    );
}
