import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin@QuickRider2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@quickridergh.com' },
    update: {},
    create: {
      email: 'admin@quickridergh.com',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Default pricing config
  await prisma.pricingConfig.upsert({
    where: { id: 'default-pricing' },
    update: {},
    create: {
      id: 'default-pricing',
      baseFare: 5.00,
      perKmRate: 2.50,
      perMinuteRate: 0.50,
      platformFeePercent: 15.00,
      minimumFare: 8.00,
      surgeMultiplier: 1.0,
      isActive: true,
    },
  });
  console.log('✅ Default pricing configured');

  // System configs
  const configs = [
    { key: 'commission_percent', value: '15' },
    { key: 'max_active_requests_per_rider', value: '1' },
    { key: 'rider_search_radius_km', value: '10' },
    { key: 'otp_expiry_minutes', value: '10' },
    { key: 'app_version_android', value: '1.0.0' },
    { key: 'app_version_ios', value: '1.0.0' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log('✅ System configs set');

  console.log('🎉 Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
