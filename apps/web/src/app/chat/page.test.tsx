import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ChatWindow from './page';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
}));

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('ChatWindow Component', () => {
    let mockSocket: any;

    beforeEach(() => {
        const mockUser = {
            id: '123',
            email: 'test@test.com',
            name: 'Test User',
            role: 'STUDENT',
        };
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem('user', JSON.stringify(mockUser));

        mockSocket = {
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn(),
            disconnect: jest.fn(),
        };
        (io as jest.Mock).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('should render chat interface', () => {
        render(<ChatWindow />);

        expect(screen.getByText('Toolzz Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument();
    });

    it('should redirect to login when no token', () => {
        localStorage.removeItem('token');
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '' } as any;

        render(<ChatWindow />);

        expect(window.location.href).toBe('/');

        window.location = originalLocation;
    });

    it('should connect to socket on mount', () => {
        render(<ChatWindow />);

        expect(io).toHaveBeenCalled();
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should send message when form is submitted', async () => {
        render(<ChatWindow />);

        act(() => {
            const connectHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'connect'
            )?.[1];
            if (connectHandler) connectHandler();
        });

        act(() => {
            const roomJoinedHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'roomJoined'
            )?.[1];
            if (roomJoinedHandler) {
                roomJoinedHandler({
                    room: { id: 'room1', name: 'General', type: 'GROUP' },
                    messages: [],
                });
            }
        });

        const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLInputElement;
        const sendButton = screen.getByRole('button', { name: /enviar/i });

        await act(async () => {
            fireEvent.change(input, { target: { value: 'Hello World' } });
            fireEvent.click(sendButton);
        });

        expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', {
            roomId: 'room1',
            content: 'Hello World',
        });
        expect(input.value).toBe('');
    });

    it('should display received messages', async () => {
        render(<ChatWindow />);

        const mockMessage = {
            id: 'msg1',
            content: 'Test message',
            createdAt: new Date().toISOString(),
            user: {
                id: '456',
                name: 'Other User',
                email: 'other@test.com',
                avatarUrl: null,
            },
        };

        act(() => {
            const messageHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'newMessage'
            )?.[1];
            if (messageHandler) messageHandler(mockMessage);
        });

        await waitFor(() => {
            expect(screen.getByText('Test message')).toBeInTheDocument();
            expect(screen.getByText('Other User')).toBeInTheDocument();
        });
    });

    it('should show typing indicator', async () => {
        render(<ChatWindow />);

        act(() => {
            const typingHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'userTyping'
            )?.[1];
            if (typingHandler) {
                typingHandler({ userName: 'Other User' });
            }
        });

        await waitFor(() => {
            expect(screen.getByText(/Other User está digitando/i)).toBeInTheDocument();
        });
    });

    it('should toggle dark mode', async () => {
        render(<ChatWindow />);
        const darkModeButton = screen.getByTitle(/Modo Escuro/i);

        await act(async () => {
            fireEvent.click(darkModeButton);
        });

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should handle logout', async () => {
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '' } as any;

        render(<ChatWindow />);
        const logoutButton = screen.getByTitle('Sair');

        await act(async () => {
            fireEvent.click(logoutButton);
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(window.location.href).toBe('/');

        window.location = originalLocation;
    });

    it('should display online users', async () => {
        render(<ChatWindow />);

        const mockOnlineUsers = [
            { id: '456', name: 'User 1', email: 'user1@test.com', role: 'STUDENT' },
            { id: '789', name: 'User 2', email: 'user2@test.com', role: 'TEACHER' },
        ];

        act(() => {
            const onlineUsersHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === 'onlineUsers'
            )?.[1];
            if (onlineUsersHandler) onlineUsersHandler(mockOnlineUsers);
        });

        await waitFor(() => {
            expect(screen.getByText('User 1')).toBeInTheDocument();
            expect(screen.getByText('User 2')).toBeInTheDocument();
        });
    });
});
