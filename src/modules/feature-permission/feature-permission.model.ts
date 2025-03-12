import { z } from 'zod';

const FeaturePermissionSchema = z.object({
  id: z.string(),
});

type TFeaturePermission = z.infer<typeof FeaturePermissionSchema>;

export { FeaturePermissionSchema, TFeaturePermission };
