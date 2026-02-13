import { User } from '../../types/chat';

interface ChatSidebarProps {
    onlineUsers: User[];
    currentUserId: string;
    onStartPrivateChat: (userId: string) => void;
}

export function ChatSidebar({ onlineUsers, currentUserId, onStartPrivateChat }: ChatSidebarProps) {
    return (
        <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-colors duration-300">
            <div className="p-4">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center justify-between transition-colors">
                    <span>Usuários Online</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full transition-colors">
                        {onlineUsers.length}
                    </span>
                </h2>
                <div className="space-y-2">
                    {onlineUsers
                        .filter((u) => u.id !== currentUserId)
                        .map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onStartPrivateChat(user.id)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left cursor-pointer"
                                title={`Conversar com ${user.name || user.email}`}
                            >
                                <div className="relative">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full transition-colors"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate transition-colors">
                                        {user.name || user.email}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate transition-colors">{user.role}</p>
                                </div>
                            </button>
                        ))}
                    {onlineUsers.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4 transition-colors">Nenhum usuário online</p>
                    )}
                </div>
            </div>
        </aside>
    );
}
