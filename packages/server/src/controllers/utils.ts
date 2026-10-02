import { Request }           from 'express';
import { z }                 from 'zod';
import { ItemsListCriteria } from '../store/types.js';


export const itemsListCriteriaSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  from: z.coerce.number().optional(),
}) satisfies z.ZodType<ItemsListCriteria<number>, unknown>;


export const getCriteria = (req: Request): ItemsListCriteria<number> => itemsListCriteriaSchema.parse(req.query);
