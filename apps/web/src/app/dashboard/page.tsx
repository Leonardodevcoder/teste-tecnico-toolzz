'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, LogOut } from 'lucide-react';

export default function DashboardPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken || !storedUser) {
            window.location.href = '/';
            return;
        }

        setCurrentUser(JSON.parse(storedUser));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    if (!currentUser) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Toolzz Platform</h1>
                        <p className="text-sm text-gray-500">Bem-vindo, {currentUser.name || currentUser.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-600 transition hover:bg-red-200"
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="mt-2 text-gray-600">Escolha uma funcionalidade abaixo para começar</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <a
                        href="/chat"
                        className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-100 opacity-50 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                        <div className="relative">
                            <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
                                <MessageSquare className="text-blue-600" size={32} />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">Chat em Tempo Real</h3>
                            <p className="text-gray-600">
                                Converse com outros usuários em tempo real. Histórico completo e busca de mensagens.
                            </p>
                            <div className="mt-4 flex items-center text-blue-600 font-semibold">
                                Acessar Chat
                                <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </a>

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER') && (
                        <a
                            href="/admin/users"
                            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-100 opacity-50 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                            <div className="relative">
                                <div className="mb-4 inline-flex rounded-full bg-purple-100 p-4">
                                    <Users className="text-purple-600" size={32} />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-gray-900">Gerenciar Usuários</h3>
                                <p className="text-gray-600">
                                    Administre usuários do sistema. Criar, editar, deletar e buscar usuários.
                                </p>
                                <div className="mt-4 flex items-center text-purple-600 font-semibold">
                                    Acessar Painel
                                    <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                    )}


                </div>

                <div className="mt-12 rounded-2xl bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Informações da Conta</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500">Nome</p>
                            <p className="font-semibold text-gray-900">{currentUser.name || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">{currentUser.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Perfil</p>
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${currentUser.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : currentUser.role === 'TEACHER'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                            >
                                {currentUser.role}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
