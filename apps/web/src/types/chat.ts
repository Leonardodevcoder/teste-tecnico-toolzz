export interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

export interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

export interface Room {
    id: string;
    type: 'DIRECT' | 'GROUP';
    otherUser?: {
        id: string;
        name: string | null;
        email: string;
    };
}

export interface ChatState {
    socket: any | null;
    messages: Message[];
    connected: boolean;
    currentUser: User | null;
    currentRoom: Room | null;
    typingUsers: string[];
    onlineUsers: User[];
    hasMore: boolean;
    isLoadingMore: boolean;
}
