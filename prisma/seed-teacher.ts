// prisma/seed-teacher.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import 'dotenv/config';

// No Prisma 6, ele lê do .env automaticamente
const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('123456');

    // Cria um Professor
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@toolzz.com' },
        update: {},
        create: {
            email: 'teacher@toolzz.com',
            name: 'Professor Edulabzz',
            password,
            role: 'TEACHER',
        },
    });

    // Cria um Aluno também pro teste ficar completo
    const student = await prisma.user.upsert({
        where: { email: 'student@toolzz.com' },
        update: {},
        create: {
            email: 'student@toolzz.com',
            name: 'Aluno Toolzz',
            password,
            role: 'STUDENT',
        },
    });

    console.log({ teacher, student });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
