import { DB } from '@/database/database';

export class UserService {
  base = DB.user;
  constructor() {}
}

export const userService = new UserService();
