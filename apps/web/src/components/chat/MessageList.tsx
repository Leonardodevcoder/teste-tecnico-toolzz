import { useRef, useEffect } from 'react';
import { Message, User } from '../../types/chat';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
}

export function MessageList({ messages, currentUserId, isLoadingMore, onLoadMore, hasMore }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const topObserverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!topObserverRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
                    onLoadMore();
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(topObserverRef.current);

        return () => observer.disconnect();
    }, [isLoadingMore, hasMore, onLoadMore]);

    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollBehavior: 'smooth' }}>
            <div className="mx-auto max-w-4xl space-y-4">
                <div ref={topObserverRef} className="h-1" />

                {isLoadingMore && (
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500 animate-pulse transition-colors">
                        Carregando mais mensagens...
                    </p>
                )}

                {messages.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 mt-10 transition-colors">
                        Nenhuma mensagem encontrada.
                    </p>
                )}

                {messages.map((msg) => {
                    const isMe = msg.user.id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm transition-colors ${isMe
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                                    }`}
                            >
                                {!isMe && (
                                    <p className="mb-1 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors">
                                        {msg.user.name || msg.user.email}
                                    </p>
                                )}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                <p
                                    className={`mt-1 text-[10px] ${isMe ? 'text-blue-200 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'
                                        } text-right transition-colors`}
                                >
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </main>
    );
}
