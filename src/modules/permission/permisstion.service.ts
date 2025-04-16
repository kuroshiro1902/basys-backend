import { ResponseData } from '../shared/models/response-data.model';
import { UserSchema } from '../user/user.model';
import { PermissionRepository } from './permission.repository';

export class PermissionService {
  constructor(private permissionRepository = new PermissionRepository()) {}
  async getPermissionsByUserId(user_id: number) {
    const validUserId = UserSchema.shape.id.parse(user_id);
    const s = await this.permissionRepository.findMany({
      where: { users: { every: { user_id: validUserId } }, active: true },
    });
    return ResponseData.success({ data: s });
  }
}
