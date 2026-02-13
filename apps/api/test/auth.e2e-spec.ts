import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

describe('AuthController (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up database before each test
        await prisma.message.deleteMany();
        await prisma.room.deleteMany();
        await prisma.user.deleteMany();
    });

    describe('/api/auth/register (POST)', () => {
        it('should register a new user', async () => {
            // Arrange
            const newUser = {
                email: 'newuser@test.com',
                password: 'password123',
                name: 'New User',
            };

            // Act
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(newUser)
                .expect(201);

            // Assert
            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(newUser.email);
            expect(response.body.name).toBe(newUser.name);
            expect(response.body.password).toBeUndefined();
        });

        it('should return 409 when email already exists', async () => {
            // Arrange
            const existingUser = {
                email: 'existing@test.com',
                password: await argon2.hash('password123'),
                name: 'Existing User',
                role: 'STUDENT',
            };
            await prisma.user.create({ data: existingUser });

            // Act & Assert
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'existing@test.com',
                    password: 'password123',
                    name: 'Another User',
                })
                .expect(409);
        });

        it('should return 400 for invalid email', async () => {
            // Act & Assert
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'User',
                })
                .expect(400);
        });

        it('should return 400 for short password', async () => {
            // Act & Assert
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'user@test.com',
                    password: '123',
                    name: 'User',
                })
                .expect(400);
        });
    });

    describe('/api/auth/login (POST)', () => {
        beforeEach(async () => {
            // Create test user
            await prisma.user.create({
                data: {
                    email: 'test@test.com',
                    password: await argon2.hash('password123'),
                    name: 'Test User',
                    role: 'STUDENT',
                },
            });
        });

        it('should login with valid credentials', async () => {
            // Act
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123',
                })
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('access_token');
            expect(response.body.user).toHaveProperty('email', 'test@test.com');
            expect(response.body.user.password).toBeUndefined();
        });

        it('should return 401 for invalid password', async () => {
            // Act & Assert
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        it('should return 401 for non-existent user', async () => {
            // Act & Assert
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'password123',
                })
                .expect(401);
        });
    });

    describe('/api/auth/2fa/generate (GET)', () => {
        let authToken: string;

        beforeEach(async () => {
            // Create and login user
            await prisma.user.create({
                data: {
                    email: 'test@test.com',
                    password: await argon2.hash('password123'),
                    name: 'Test User',
                    role: 'STUDENT',
                },
            });

            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123',
                });

            authToken = loginResponse.body.access_token;
        });

        it('should generate 2FA secret and QR code for authenticated user', async () => {
            // Act
            const response = await request(app.getHttpServer())
                .get('/api/auth/2fa/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('secret');
            expect(response.body).toHaveProperty('qrCode');
            expect(response.body.qrCode).toContain('data:image/png;base64');
        });

        it('should return 401 without authentication', async () => {
            // Act & Assert
            await request(app.getHttpServer())
                .get('/api/auth/2fa/generate')
                .expect(401);
        });
    });

    describe('Authentication Flow', () => {
        it('should complete full registration and login flow', async () => {
            // Step 1: Register
            const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'flowtest@test.com',
                    password: 'password123',
                    name: 'Flow Test User',
                })
                .expect(201);

            expect(registerResponse.body.email).toBe('flowtest@test.com');

            // Step 2: Login
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'flowtest@test.com',
                    password: 'password123',
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('access_token');

            // Step 3: Access protected route
            const token = loginResponse.body.access_token;
            const protectedResponse = await request(app.getHttpServer())
                .get('/api/auth/2fa/generate')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(protectedResponse.body).toHaveProperty('secret');
        });
    });
});
