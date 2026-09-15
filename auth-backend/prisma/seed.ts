import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating admin users...');

    const password = await bcrypt.hash('Test@123456', 10);

    await prisma.user.upsert({
        where: {
            email: 'admin@platform.com',
        },
        update: {},
        create: {
            name: 'Admin Master',
            email: 'admin@platform.com',
            password,
            phone: '+967777000001',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    await prisma.user.upsert({
        where: {
            email: 'superadmin@platform.com',
        },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'superadmin@platform.com',
            password,
            phone: '+967777000002',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    console.log('✅ Admin users created/verified successfully');
}

main()
    .catch((error) => {
        console.error('❌ Seed error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });