import { postgres } from '@/lib/prisma.lib';

export class UserService {
  base = postgres.user;
  constructor() {}
}

export const userService = new UserService();
