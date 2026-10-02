import { z } from 'zod';


export type AvailableItemsListResponse = {
  items: number[];
  next: number | null;
};

export const AvailableItemCreationRequestSchema = z.object({
  value: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});

export type AvailableItemCreationRequest = z.infer<typeof AvailableItemCreationRequestSchema>;