import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaService;

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

    const mockPrismaService = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new user with hashed password', async () => {
            // Arrange
            const createUserDto = {
                email: 'newuser@test.com',
                password: 'password123',
                name: 'New User',
                role: 'STUDENT' as const,
            };
            (argon2.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue(mockUser);

            // Act
            const result = await service.create(createUserDto);

            // Assert
            expect(argon2.hash).toHaveBeenCalledWith('password123');
            expect(mockPrismaService.user.create).toHaveBeenCalledWith({
                data: {
                    email: createUserDto.email,
                    password: 'hashedPassword',
                    name: createUserDto.name,
                    role: createUserDto.role,
                },
            });
            expect(result.password).toBeUndefined();
        });

        it('should throw ConflictException when email already exists', async () => {
            // Arrange
            const createUserDto = {
                email: 'existing@test.com',
                password: 'password123',
                name: 'User',
                role: 'STUDENT' as const,
            };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act & Assert
            await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            const result = await service.findByEmail('test@test.com');

            // Assert
            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
            });
        });

        it('should return null when user not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await service.findByEmail('nonexistent@test.com');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            const result = await service.findById('123');

            // Assert
            const { password, ...expectedUser } = mockUser;
            expect(result).toEqual(expectedUser);
        });

        it('should throw NotFoundException when user not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return all users without passwords', async () => {
            // Arrange
            const users = [mockUser, { ...mockUser, id: '456', email: 'user2@test.com' }];
            mockPrismaService.user.findMany.mockResolvedValue(
                users.map(({ password, twoFactorSecret, ...user }) => user)
            );

            // Act
            const result = await service.findAll();

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].password).toBeUndefined();
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            // Arrange
            const updateData = { name: 'Updated Name' };
            const updatedUser = { ...mockUser, name: 'Updated Name' };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.update.mockResolvedValue(updatedUser);

            // Act
            const result = await service.update('123', updateData);

            // Assert
            expect(result.name).toBe('Updated Name');
            expect(result.password).toBeUndefined();
        });

        it('should throw NotFoundException when user not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe('delete', () => {
        it('should delete user successfully', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.user.delete.mockResolvedValue(mockUser);

            // Act
            await service.delete('123');

            // Assert
            expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
                where: { id: '123' },
            });
        });

        it('should throw NotFoundException when user not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('OAuth and 2FA methods', () => {
        describe('createGoogleUser', () => {
            it('should create user from Google profile', async () => {
                // Arrange
                const profile = {
                    googleId: 'google123',
                    email: 'google@test.com',
                    name: 'Google User',
                    avatarUrl: 'https://avatar.url',
                };
                mockPrismaService.user.create.mockResolvedValue({
                    ...mockUser,
                    googleId: 'google123',
                });

                // Act
                const result = await service.createGoogleUser(profile);

                // Assert
                expect(mockPrismaService.user.create).toHaveBeenCalledWith({
                    data: {
                        email: profile.email,
                        name: profile.name,
                        googleId: profile.googleId,
                        avatarUrl: profile.avatarUrl,
                        role: 'STUDENT',
                        password: null,
                    },
                });
                expect(result.password).toBeUndefined();
            });
        });

        describe('enable2FA', () => {
            it('should enable 2FA for user', async () => {
                // Arrange
                mockPrismaService.user.update.mockResolvedValue({
                    ...mockUser,
                    twoFactorEnabled: true,
                });

                // Act
                await service.enable2FA('123');

                // Assert
                expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                    where: { id: '123' },
                    data: { twoFactorEnabled: true },
                });
            });
        });
    });
});
