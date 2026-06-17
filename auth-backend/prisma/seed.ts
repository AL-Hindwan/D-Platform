import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Delete all existing data (in correct order due to foreign keys)
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.roomBooking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.course.deleteMany();
    await prisma.courseCategory.deleteMany();
    await prisma.institute.deleteMany();
    await prisma.trainerProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Common password for all users
    const commonPassword = await hashPassword('Test@123456');

    // ================================================
    // USERS
    // ================================================
    console.log('👥 Creating Admin users...');

    // Platform Admins
    await prisma.user.create({
        data: {
            name: 'Admin Master',
            email: 'admin@platform.com',
            password: commonPassword,
            phone: '+967777000001',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'superadmin@platform.com',
            password: commonPassword,
            phone: '+967777000002',
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    console.log('✅ Created 2 Platform Admins\n');
    console.log('=====================================');
    console.log('✨ Database seeding completed successfully! Only Admins were created.');
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
