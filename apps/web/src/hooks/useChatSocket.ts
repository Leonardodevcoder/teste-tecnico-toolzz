import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Message, User, Room } from '../types/chat';

interface UseChatSocketReturn {
    socket: Socket | null;
    messages: Message[];
    connected: boolean;
    currentUser: User | null;
    currentRoom: Room | null;
    typingUsers: string[];
    onlineUsers: User[];
    hasMore: boolean;
    isLoadingMore: boolean;
    sendMessage: (content: string) => void;
    sendTypingIndicator: (isTyping: boolean) => void;
    joinPrivateRoom: (targetUserId: string) => void;
    loadMoreMessages: () => Promise<void>;
    setIsSearching: (searching: boolean) => void;
}

export function useChatSocket(): UseChatSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken || !storedUser) {
            window.location.href = '/';
            return;
        }

        setCurrentUser(JSON.parse(storedUser));

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const socketUrl = apiUrl.replace('/api', '');

        const socketInstance = io(socketUrl, {
            auth: { token: storedToken },
            transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
            setConnected(true);
            toast.success('Conectado ao Chat Real-time!');
        });

        socketInstance.on('disconnect', () => {
            setConnected(false);
        });

        socketInstance.on('joinedRoom', (room: Room) => {
            setCurrentRoom(room);
        });

        socketInstance.on('history', (history: any) => {
            if (!isSearching) {
                const msgs = history.messages || history;
                setMessages(msgs);
                if (history.hasMore !== undefined) {
                    setHasMore(history.hasMore);
                }
            }
        });

        socketInstance.on('msgToClient', (newMessage: Message) => {
            if (!isSearching) {
                setMessages((prev) => [...prev, newMessage]);
            }

            const senderName = newMessage.user.name || newMessage.user.email;
            setTypingUsers((prev) => prev.filter((name) => name !== senderName));
        });

        socketInstance.on('userTyping', (data: { user: { name: string }; isTyping: boolean }) => {
            const name = data.user.name;
            if (data.isTyping) {
                setTypingUsers((prev) => Array.from(new Set([...prev, name])));
            } else {
                setTypingUsers((prev) => prev.filter((n) => n !== name));
            }
        });

        socketInstance.on('onlineUsers', (users: User[]) => {
            setOnlineUsers(users);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [isSearching]);

    const sendMessage = (content: string) => {
        if (!socket || !currentRoom || !content.trim()) return;

        socket.emit('msgToServer', {
            content,
            roomId: currentRoom.id,
        });
    };

    const sendTypingIndicator = (isTyping: boolean) => {
        if (!socket || !currentRoom) return;
        socket.emit('typing', { roomId: currentRoom.id, isTyping });
    };

    const joinPrivateRoom = (targetUserId: string) => {
        if (!socket) return;
        socket.emit('joinPrivateRoom', { targetUserId });
        toast.success('Entrando em chat privado...');
    };

    const loadMoreMessages = async () => {
        if (!currentRoom || isLoadingMore || !hasMore || isSearching) return;

        try {
            setIsLoadingMore(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            const oldestMessageId = messages.length > 0 ? messages[0].id : null;

            const url = oldestMessageId
                ? `${apiUrl}/chat/messages/${currentRoom.id}?cursor=${oldestMessageId}&take=50`
                : `${apiUrl}/chat/messages/${currentRoom.id}?take=50`;

            const response = await fetch(url);
            const data = await response.json();

            setHasMore(data.hasMore || false);

            if (data.messages && data.messages.length > 0) {
                setMessages((prev) => {
                    const existingIds = new Set(prev.map((m) => m.id));
                    const newMessages = data.messages.filter((msg: Message) => !existingIds.has(msg.id));
                    return [...newMessages, ...prev];
                });
            }
        } catch (error) {
            console.error('Erro ao carregar mais mensagens:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return {
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
    };
}
