import { DB } from '@/database/database';
import { Feature, Prisma, PrismaClient, RefreshToken, User } from '@prisma/client';
import { TFeaturePermission } from '../feature-permission/feature-permission.model';
import { REFRESH_TOKEN_EXPIRED_TIMESTAMP } from '../auth/auth.const';
import { CONFIG } from '@/config/config';

export class UserRepository {
  // async findAll(): Promise<User[]> {
  //   return DB.user.findMany({});
  // }
  findMany = DB.user.findMany;

  // async findById(id: number): Promise<User | null> {
  //   return DB.user.findFirst({ where: { id } });
  // }

  // async findByEmail(email: string) {
  //   return DB.user.findFirst({ where: { email }, include: { refresh_tokens: true, features: { select: { feature: true } } } });
  // }
  findOne = DB.user.findFirst;

  // async findByRefreshToken(refreshToken: string): Promise<(User & { refresh_tokens: RefreshToken[] }) | null> {
  //   return DB.user.findFirst({
  //     where: {
  //       refresh_tokens: {
  //         some: { token: refreshToken },
  //       },
  //     },
  //     include: {
  //       refresh_tokens: true, // Lấy danh sách refresh token của user
  //     },
  //   });
  // }

  // async createOne(user: Pick<Prisma.UserCreateInput, 'name' | 'email' | 'password'> & { features?: Pick<Feature, 'id'>[] }): Promise<User> {
  //   const { features = [], ...newUser } = user;

  //   return DB.$transaction(async (tx) => {
  //     const createdUser = await tx.user.create({
  //       data: newUser,
  //     });

  //     if (features.length > 0) {
  //       await tx.userFeature.createMany({
  //         data: features.map(({ id }) => ({
  //           user_id: createdUser.id,
  //           feature_id: id,
  //         })),
  //         skipDuplicates: true,
  //       });
  //     }
  //     return createdUser;
  //   });
  // }

  create = DB.user.create;
  $transaction = DB.$transaction;

  // async updateOne(
  //   userId: number,
  //   data: Partial<Pick<User, 'name'>> & { features?: Feature[]; refresh_tokens?: RefreshToken[] },
  // ): Promise<User | null> {
  //   const user = await DB.$transaction(async (tx) => {
  //     const { name, features, refresh_tokens } = data;

  //     let updatedUser: User | undefined;
  //     // Cập nhật tên user nếu có
  //     if (name) {
  //       updatedUser = await tx.user.update({
  //         where: { id: userId },
  //         data: name ? { name } : {},
  //       });
  //     }

  //     // Cập nhật features nếu có
  //     if (features) {
  //       await this.setFeatures(userId, features, tx);
  //     }

  //     // Cập nhật refresh_tokens nếu có
  //     if (refresh_tokens) {
  //       await this.setRefreshTokens(userId, refresh_tokens, tx);
  //     }

  //     return updatedUser;
  //   });

  //   return user ?? (await DB.user.findUnique({ where: { id: userId } }));
  // }

  update = DB.user.update;

  // async setFeatures(userId: number, features: Feature[], tx?: Prisma.TransactionClient) {
  //   if (!features || features.length === 0) return;

  //   const transaction = async (tx: Prisma.TransactionClient) => {
  //     // Lấy danh sách features hiện tại của user
  //     const existingFeatures = await tx.userFeature.findMany({
  //       where: { user_id: userId },
  //       select: { feature_id: true },
  //     });

  //     const existingFeatureSet = new Set(existingFeatures.map((f) => f.feature_id));
  //     const newFeatureSet = new Set(features.map((f) => f.id));

  //     // Tìm feature cần xóa (có trong database nhưng không có trong danh sách mới)
  //     const featuresToDelete = existingFeatures.filter((f) => !newFeatureSet.has(f.feature_id)).map((f) => f.feature_id);

  //     // Tìm feature cần tạo (có trong danh sách mới nhưng chưa có trong database)
  //     const featuresToCreate = features.filter((f) => !existingFeatureSet.has(f.id));

  //     // Xóa features không có trong danh sách mới
  //     if (featuresToDelete.length > 0) {
  //       await tx.userFeature.deleteMany({
  //         where: { user_id: userId, feature_id: { in: featuresToDelete } },
  //       });
  //     }

  //     // Thêm features mới chưa có trong database
  //     if (featuresToCreate.length > 0) {
  //       await tx.userFeature.createMany({
  //         data: featuresToCreate.map((f) => ({
  //           user_id: userId,
  //           feature_id: f.id,
  //         })),
  //       });
  //     }
  //   };

  //   if (tx) {
  //     return await transaction(tx);
  //   } else {
  //     return DB.$transaction(transaction);
  //   }
  // }

  // /**
  //  *
  //  * @param userId
  //  * @param refresh_tokens
  //  * @description Xóa hết token trong db và set bằng các token mới, dùng trong trường hợp detect reuse attack.
  //  */
  // async resetRefreshTokens(userId: number, refresh_tokens?: Prisma.RefreshTokenCreateWithoutUserInput[]) {
  //   return DB.$transaction(async (tx) => {
  //     await tx.refreshToken.deleteMany({
  //       where: { user_id: userId },
  //     });

  //     if (refresh_tokens && refresh_tokens.length > 0) {
  //       await tx.refreshToken.createMany({
  //         data: refresh_tokens.map((t) => ({
  //           user_id: userId,
  //           token: t.token,
  //           expiresAt: t.expiresAt,
  //         })),
  //       });
  //     }
  //   });
  // }

  // /**
  //  *
  //  * @param userId
  //  * @param refresh_tokens$
  //  * @param tx
  //  * @description Tối ưu hiệu suất hơn do không thực hiện set lại hết tokens.
  //  */
  // async setRefreshTokens(userId: number, refresh_tokens$?: Prisma.RefreshTokenCreateWithoutUserInput[], tx?: Prisma.TransactionClient) {
  //   if (!refresh_tokens$ || refresh_tokens$.length === 0) return;

  //   const refresh_tokens = refresh_tokens$.map((rf) => ({ ...rf, created_at: new Date() }));

  //   const transaction = async (tx: Prisma.TransactionClient) => {
  //     // Lấy danh sách refresh_tokens hiện tại, sắp xếp theo created_at
  //     const existingTokens = await tx.refreshToken.findMany({
  //       where: { user_id: userId },
  //       orderBy: { created_at: 'desc' }, // Mới nhất -> cũ nhất
  //       select: { token: true, created_at: true, expiresAt: true },
  //     });

  //     // Hợp nhất với refresh_tokens mới, loại bỏ trùng lặp
  //     const tokenMap = new Map<string, Omit<RefreshToken, 'user_id'>>();

  //     [...refresh_tokens, ...existingTokens].forEach((token) => {
  //       tokenMap.set(token.token, token);
  //     });

  //     // Giữ lại CONFIG.refresh_token.max_amount_per_user token mới nhất
  //     const latestTokens = Array.from(tokenMap.values())
  //       .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()) // Sắp xếp theo thời gian tạo
  //       .slice(0, CONFIG.refresh_token.max_amount_per_user);

  //     // Lấy danh sách token còn lại sau khi lọc
  //     const latestTokenSet = new Set(latestTokens.map((t) => t.token));

  //     // Xóa token cũ không nằm trong danh sách mới
  //     await tx.refreshToken.deleteMany({
  //       where: {
  //         user_id: userId,
  //         token: { notIn: Array.from(latestTokenSet) },
  //       },
  //     });

  //     // Lấy danh sách token cần tạo mới (chưa có trong database)
  //     const existingTokenSet = new Set(existingTokens.map((t) => t.token));
  //     const tokensToCreate = latestTokens.filter((t) => !existingTokenSet.has(t.token));

  //     // Thêm token mới vào database
  //     if (tokensToCreate.length > 0) {
  //       await tx.refreshToken.createMany({
  //         data: tokensToCreate.map((t) => ({
  //           token: t.token,
  //           user_id: userId,
  //           expiresAt: t.expiresAt,
  //         })),
  //       });
  //     }
  //   };

  //   if (tx) {
  //     return await transaction(tx);
  //   } else {
  //     return DB.$transaction(transaction);
  //   }
  // }
}
