/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('123456');

    // Cria admin
    const user = await prisma.user.upsert({
        where: { email: 'admin@toolzz.com' },
        update: {},
        create: {
            email: 'admin@toolzz.com',
            name: 'Admin Toolzz',
            password,
            role: 'ADMIN',
        },
    });

    console.log({ user });
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
