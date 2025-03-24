import { ResponseData } from '../shared/models/response-data.model';
import { TUserSelect, UserDefaultSelect } from './user.model';
import { UserRepository } from './user.repository';

export class UserService {
  constructor(private userRepository = new UserRepository()) {}

  async getUserById(id: number, select: TUserSelect = UserDefaultSelect) {
    const user = await this.userRepository.findOne({ where: { id }, select });
    return ResponseData.success(user);
  }
}

export const userService = new UserService();
