import { PrismaClient, UserRole, UserStatus, RiderStatus, AvailabilityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo customers and riders...');

  const password = await bcrypt.hash('Password123!', 12);

  // ── Customers ───────────────────────────────────────────────────────────────
  const customers = [
    { firstName: 'Kwame',   lastName: 'Mensah',    email: 'kwame.mensah@gmail.com',     phone: '+233244123456' },
    { firstName: 'Abena',   lastName: 'Asante',    email: 'abena.asante@gmail.com',     phone: '+233244234567' },
    { firstName: 'Kofi',    lastName: 'Boateng',   email: 'kofi.boateng@yahoo.com',     phone: '+233244345678' },
    { firstName: 'Akosua',  lastName: 'Darko',     email: 'akosua.darko@gmail.com',     phone: '+233244456789' },
    { firstName: 'Yaw',     lastName: 'Owusu',     email: 'yaw.owusu@gmail.com',        phone: '+233244567890' },
    { firstName: 'Ama',     lastName: 'Acheampong', email: 'ama.acheampong@hotmail.com', phone: '+233244678901' },
    { firstName: 'Kojo',    lastName: 'Amponsah',  email: 'kojo.amponsah@gmail.com',    phone: '+233244789012' },
    { firstName: 'Efua',    lastName: 'Quaye',     email: 'efua.quaye@gmail.com',       phone: '+233244890123' },
    { firstName: 'Nana',    lastName: 'Sarkodie',  email: 'nana.sarkodie@gmail.com',    phone: '+233244901234' },
    { firstName: 'Adwoa',   lastName: 'Frimpong',  email: 'adwoa.frimpong@gmail.com',   phone: '+233245012345' },
  ];

  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        ...c,
        passwordHash: password,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });
  }
  console.log(`✅ ${customers.length} customers created`);

  // ── Riders ───────────────────────────────────────────────────────────────────
  const riders = [
    {
      user: { firstName: 'Emmanuel', lastName: 'Tetteh',   email: 'emma.tetteh@gmail.com',    phone: '+233200111001' },
      rider: { make: 'Yamaha',  model: 'FZ-S',    color: 'Red',    plate: 'GR-1234-22', status: RiderStatus.APPROVED,  avail: AvailabilityStatus.ONLINE,  lat: 5.6037, lng: -0.1870, rating: 4.8, deliveries: 142 },
    },
    {
      user: { firstName: 'Solomon',  lastName: 'Amoah',    email: 'sol.amoah@gmail.com',       phone: '+233200222002' },
      rider: { make: 'Honda',   model: 'CB125',   color: 'Black',  plate: 'AS-5678-21', status: RiderStatus.APPROVED,  avail: AvailabilityStatus.ONLINE,  lat: 5.6150, lng: -0.2050, rating: 4.6, deliveries: 98  },
    },
    {
      user: { firstName: 'Benjamin', lastName: 'Opoku',    email: 'ben.opoku@gmail.com',       phone: '+233200333003' },
      rider: { make: 'Suzuki',  model: 'GS150',   color: 'Blue',   plate: 'AW-9101-23', status: RiderStatus.APPROVED,  avail: AvailabilityStatus.OFFLINE, lat: 5.5900, lng: -0.2200, rating: 4.9, deliveries: 207 },
    },
    {
      user: { firstName: 'Richard',  lastName: 'Asare',    email: 'richard.asare@gmail.com',   phone: '+233200444004' },
      rider: { make: 'Bajaj',   model: 'Boxer',   color: 'Green',  plate: 'GT-1121-22', status: RiderStatus.APPROVED,  avail: AvailabilityStatus.BUSY,    lat: 5.6200, lng: -0.1700, rating: 4.5, deliveries: 63  },
    },
    {
      user: { firstName: 'Francis',  lastName: 'Gyasi',    email: 'francis.gyasi@gmail.com',   phone: '+233200555005' },
      rider: { make: 'TVS',     model: 'Apache',  color: 'Orange', plate: 'GN-3141-21', status: RiderStatus.PENDING,   avail: AvailabilityStatus.OFFLINE, lat: null,   lng: null,   rating: 0,   deliveries: 0   },
    },
    {
      user: { firstName: 'Sampson',  lastName: 'Koomson',  email: 'sampson.k@gmail.com',       phone: '+233200666006' },
      rider: { make: 'Honda',   model: 'Wave',    color: 'Silver', plate: 'CP-5161-23', status: RiderStatus.PENDING,   avail: AvailabilityStatus.OFFLINE, lat: null,   lng: null,   rating: 0,   deliveries: 0   },
    },
    {
      user: { firstName: 'Isaac',    lastName: 'Nyarko',   email: 'isaac.nyarko@gmail.com',    phone: '+233200777007' },
      rider: { make: 'Yamaha',  model: 'Saluto',  color: 'White',  plate: 'BA-7181-22', status: RiderStatus.APPROVED,  avail: AvailabilityStatus.ONLINE,  lat: 5.6400, lng: -0.1600, rating: 4.7, deliveries: 175 },
    },
    {
      user: { firstName: 'Daniel',   lastName: 'Adjei',    email: 'daniel.adjei@gmail.com',    phone: '+233200888008' },
      rider: { make: 'Bajaj',   model: 'Pulsar',  color: 'Black',  plate: 'AH-9202-20', status: RiderStatus.REJECTED,  avail: AvailabilityStatus.OFFLINE, lat: null,   lng: null,   rating: 0,   deliveries: 0   },
    },
  ];

  for (const r of riders) {
    const existingUser = await prisma.user.findUnique({ where: { email: r.user.email } });
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          ...r.user,
          passwordHash: password,
          role: UserRole.RIDER,
          status: UserStatus.ACTIVE,
          isPhoneVerified: true,
          isEmailVerified: true,
        },
      });
      userId = newUser.id;
    }

    await prisma.rider.upsert({
      where: { userId },
      update: {
        status: r.rider.status,
        availabilityStatus: r.rider.avail,
        motorcycleMake: r.rider.make,
        motorcycleModel: r.rider.model,
        motorcycleColor: r.rider.color,
        motorcyclePlate: r.rider.plate,
        currentLatitude: r.rider.lat,
        currentLongitude: r.rider.lng,
        averageRating: r.rider.rating,
        completedDeliveries: r.rider.deliveries,
        totalEarnings: r.rider.deliveries * 18.5,
        walletBalance: r.rider.deliveries * 2.3,
        approvedAt: r.rider.status === RiderStatus.APPROVED ? new Date() : null,
      },
      create: {
        userId,
        status: r.rider.status,
        availabilityStatus: r.rider.avail,
        motorcycleMake: r.rider.make,
        motorcycleModel: r.rider.model,
        motorcycleColor: r.rider.color,
        motorcyclePlate: r.rider.plate,
        currentLatitude: r.rider.lat,
        currentLongitude: r.rider.lng,
        averageRating: r.rider.rating,
        completedDeliveries: r.rider.deliveries,
        totalEarnings: r.rider.deliveries * 18.5,
        walletBalance: r.rider.deliveries * 2.3,
        approvedAt: r.rider.status === RiderStatus.APPROVED ? new Date() : null,
      },
    });
  }
  console.log(`✅ ${riders.length} riders created`);
  console.log('🎉 Demo data seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
