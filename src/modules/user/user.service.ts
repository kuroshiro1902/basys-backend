import { ResponseData } from '../shared/models/response-data.model';
import { UserRepository } from './user.repository';

export class UserService {
  constructor(private userRepository = new UserRepository()) {}

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id }, select: { id: true, email: true, name: true } });
    return ResponseData.success(user);
  }
}

export const userService = new UserService();
