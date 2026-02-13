import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';

// Mock do argon2
jest.mock('argon2');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUser = {
        id: '123',
        email: 'test@test.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'STUDENT' as const,
        avatarUrl: null,
        googleId: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUsersService = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        findByGoogleId: jest.fn(),
        createGoogleUser: jest.fn(),
        updateGoogleId: jest.fn(),
        update2FASecret: jest.fn(),
        enable2FA: jest.fn(),
        disable2FA: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should return user without password when credentials are valid', async () => {
            // Arrange
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            (argon2.verify as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await service.validateUser('test@test.com', 'password123');

            // Assert
            expect(result).toBeDefined();
            expect(result.email).toBe('test@test.com');
        });

        it('should return null when user does not exist', async () => {
            // Arrange
            mockUsersService.findByEmail.mockResolvedValue(null);

            // Act
            const result = await service.validateUser('nonexistent@test.com', 'password123');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when password is incorrect', async () => {
            // Arrange
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            (argon2.verify as jest.Mock).mockResolvedValue(false);

            // Act
            const result = await service.validateUser('test@test.com', 'wrongpassword');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when user has no password (OAuth only)', async () => {
            // Arrange
            const oauthUser = { ...mockUser, password: null };
            mockUsersService.findByEmail.mockResolvedValue(oauthUser);

            // Act
            const result = await service.validateUser('test@test.com', 'password123');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user data', async () => {
            // Arrange
            const user = {
                id: '123',
                email: 'test@test.com',
                name: 'Test User',
                role: 'STUDENT',
                avatarUrl: null,
                twoFactorEnabled: false,
            };

            // Act
            const result = await service.login(user);

            // Assert
            expect(result).toHaveProperty('access_token');
            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.user).toEqual(user);
            expect(jwtService.sign).toHaveBeenCalledWith({
                username: user.email,
                sub: user.id,
                role: user.role,
            });
        });
    });

    describe('validateGoogleUser', () => {
        it('should return existing user when found by googleId', async () => {
            // Arrange
            const profile = {
                googleId: 'google123',
                email: 'test@test.com',
                name: 'Test User',
                avatarUrl: 'https://avatar.url',
            };
            mockUsersService.findByGoogleId.mockResolvedValue(mockUser);

            // Act
            const result = await service.validateGoogleUser(profile);

            // Assert
            expect(result).toBeDefined();
            expect(mockUsersService.findByGoogleId).toHaveBeenCalledWith('google123');
        });

        it('should create new user when not found', async () => {
            // Arrange
            const profile = {
                googleId: 'google123',
                email: 'newuser@test.com',
                name: 'New User',
                avatarUrl: 'https://avatar.url',
            };
            mockUsersService.findByGoogleId.mockResolvedValue(null);
            mockUsersService.findByEmail.mockResolvedValue(null);
            mockUsersService.createGoogleUser.mockResolvedValue(mockUser);

            // Act
            const result = await service.validateGoogleUser(profile);

            // Assert
            expect(mockUsersService.createGoogleUser).toHaveBeenCalledWith(profile);
            expect(result).toBeDefined();
        });

        it('should update existing user with googleId when found by email', async () => {
            // Arrange
            const profile = {
                googleId: 'google123',
                email: 'test@test.com',
                name: 'Test User',
            };
            mockUsersService.findByGoogleId.mockResolvedValue(null);
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            mockUsersService.updateGoogleId.mockResolvedValue({ ...mockUser, googleId: 'google123' });

            // Act
            const result = await service.validateGoogleUser(profile);

            // Assert
            expect(mockUsersService.updateGoogleId).toHaveBeenCalledWith(mockUser.id, 'google123');
            expect(result).toBeDefined();
        });
    });

    describe('verify2FAToken', () => {
        it('should return true for valid token', async () => {
            // Arrange
            const userWith2FA = { ...mockUser, twoFactorSecret: 'secret123' };
            mockUsersService.findById.mockResolvedValue(userWith2FA);

            // Mock speakeasy (would need actual implementation)
            const speakeasy = require('speakeasy');
            jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

            // Act
            const result = await service.verify2FAToken('123', '123456');

            // Assert
            expect(result).toBe(true);
        });
    });
});
