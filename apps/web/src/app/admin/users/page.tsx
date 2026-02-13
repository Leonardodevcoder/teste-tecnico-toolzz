'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Edit, Trash2, Plus, X } from 'lucide-react';
import axios from 'axios';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    createdAt: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim()) {
            const filtered = users.filter(
                (u) =>
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${apiUrl}/users?search=`);
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            toast.error('Erro ao carregar usuários');
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        setIsModalOpen(true);
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Tem certeza que deseja deletar ${user.name}?`)) return;

        try {
            await axios.delete(`${apiUrl}/users/${user.id}`);
            toast.success('Usuário deletado com sucesso!');
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao deletar usuário');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                await axios.patch(`${apiUrl}/users/${editingUser.id}`, formData);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                await axios.post(`${apiUrl}/users`, formData);
                toast.success('Usuário criado com sucesso!');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-bold">Toolzz Admin</h1>
                        <div className="flex gap-4">
                            <a href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
                                💬 Chat
                            </a>
                            <a href="/admin/users" className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
                                👥 Usuários
                            </a>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        Sair
                    </button>
                </div>
            </nav>

            <div className="p-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
                            <p className="mt-1 text-sm text-gray-500">Administre todos os usuários do sistema</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Novo Usuário
                        </button>
                    </div>

                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border px-10 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Perfil</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Criado em</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            Nenhum usuário encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'TEACHER'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                <button onClick={() => handleEdit(user)} className="mr-3 text-blue-600 hover:text-blue-900">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Senha {editingUser && '(deixe em branco para não alterar)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Perfil</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="STUDENT">Aluno</option>
                                    <option value="TEACHER">Professor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                    {editingUser ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
