'use client';

import { useDarkMode } from '../../hooks/useDarkMode';
import { useChatSocket } from '../../hooks/useChatSocket';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import axios from 'axios';
import { toast } from 'sonner';

export default function ChatWindow() {
    const { isDark, toggleDarkMode } = useDarkMode();
    const {
        socket,
        messages,
        connected,
        currentUser,
        currentRoom,
        typingUsers,
        onlineUsers,
        hasMore,
        isLoadingMore,
        sendMessage,
        sendTypingIndicator,
        joinPrivateRoom,
        loadMoreMessages,
        setIsSearching,
    } = useChatSocket();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const handleSearch = async (searchTerm: string) => {
        if (!currentRoom) return;

        if (!searchTerm.trim()) {
            window.location.reload();
            return;
        }

        try {
            setIsSearching(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const { data } = await axios.get(`${apiUrl}/chat/messages/${currentRoom.id}?search=${searchTerm}`);
            toast.success(`Encontrou ${data.length} resultados.`);
        } catch (error) {
            toast.error('Erro ao buscar mensagens.');
            setIsSearching(false);
        }
    };

    if (!currentUser) {
        return <div className="p-10 text-center">Carregando Chat...</div>;
    }

    return (
        <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <ChatHeader
                connected={connected}
                currentRoom={currentRoom}
                currentUser={currentUser}
                isDark={isDark}
                onToggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                onSearch={handleSearch}
            />

            <div className="flex flex-1 overflow-hidden">
                <ChatSidebar
                    onlineUsers={onlineUsers}
                    currentUserId={currentUser.id}
                    onStartPrivateChat={joinPrivateRoom}
                />

                <div className="flex-1 flex flex-col">
                    <MessageList
                        messages={messages}
                        currentUserId={currentUser.id}
                        isLoadingMore={isLoadingMore}
                        onLoadMore={loadMoreMessages}
                        hasMore={hasMore}
                    />

                    {typingUsers.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-800 px-6 pb-2 text-center sm:text-left transition-colors">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 italic animate-pulse transition-colors">
                                {typingUsers.join(', ')} {typingUsers.length > 1 ? 'estão digitando...' : 'está digitando...'}
                            </span>
                        </div>
                    )}

                    <MessageInput
                        connected={connected}
                        onSendMessage={sendMessage}
                        onTyping={sendTypingIndicator}
                    />
                </div>
            </div>
        </div>
    );
}
