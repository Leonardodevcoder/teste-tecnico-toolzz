import { useState } from 'react';
import { Search, LogOut, Moon, Sun } from 'lucide-react';
import { User, Room } from '../../types/chat';

interface ChatHeaderProps {
    connected: boolean;
    currentRoom: Room | null;
    currentUser: User;
    isDark: boolean;
    onToggleDarkMode: () => void;
    onLogout: () => void;
    onSearch: (term: string) => void;
}

export function ChatHeader({
    connected,
    currentRoom,
    currentUser,
    isDark,
    onToggleDarkMode,
    onLogout,
    onSearch,
}: ChatHeaderProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchTerm);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className={`h-3 w-3 rounded-full transition-colors duration-500 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                    }`}
                                title={connected ? 'Conectado' : 'Desconectado'}
                            />
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
                                    {currentRoom?.type === 'DIRECT' && currentRoom?.otherUser
                                        ? `Chat com ${currentRoom.otherUser.name || currentRoom.otherUser.email}`
                                        : 'Toolzz Chat'}
                                </h1>
                                {currentRoom?.type === 'DIRECT' && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                    >
                                        ← Voltar ao chat geral
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:flex gap-3 ml-4">
                            <a
                                href="/dashboard"
                                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                🏠 Dashboard
                            </a>
                            {(currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER') && (
                                <a
                                    href="/admin/users"
                                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    👥 Usuários
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px] transition-colors">
                            {currentUser.name || currentUser.email}
                        </span>
                        <button
                            onClick={onToggleDarkMode}
                            className="rounded-lg bg-gray-100 dark:bg-gray-700 p-2 text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-gray-600"
                            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={onLogout}
                            className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 text-red-600 dark:text-red-400 transition hover:bg-red-200 dark:hover:bg-red-900/50"
                            title="Sair"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex w-full relative">
                    <input
                        className="w-full rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none pr-10 transition-colors"
                        placeholder="Buscar na conversa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                        <Search size={16} />
                    </button>
                </form>
            </div>
        </header>
    );
}
