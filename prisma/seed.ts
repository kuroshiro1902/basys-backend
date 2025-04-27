// admin
const ADMIN = {
  email: 'admin@gmail.com',
  password: '123456',
  name: 'ADMIN',
};

// permissions
const PERMISSIONS = [
  { id: 'admin', name: 'ADMIN' },
  { id: 'user', name: 'USER' },
];

import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcrypt';

const DB = new PrismaClient();

const seed = async () => {
  // upsert permissions
  for (const permission of PERMISSIONS) {
    await DB.permission.upsert({
      where: { id: permission.id }, // Unique identifier
      update: { name: permission.name }, // Update if exists
      create: { id: permission.id, name: permission.name }, // Create if not exists
    });
  }

  // upsert admin
  const existingAdmin = await DB.user.findFirst({ where: { email: ADMIN.email } });
  if (existingAdmin) {
    return existingAdmin;
  }
  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
  return await DB.$transaction(async (tx) => {
    const admin = await tx.user.create({
      data: { ...ADMIN, password: hashedPassword, updated_at: new Date() },
    });
    await tx.userPermission.create({
      data: {
        user_id: admin.id,
        permission_id: 'admin',
      },
    });
    return admin;
  });
};

seed()
  .then((admin) => {
    console.log('Seed completed, ', { admin });
  })
  .catch(console.error);
