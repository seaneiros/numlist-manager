import { z } from 'zod';


export type SelectedItemsListResponse = {
  items: number[];
  next: number | null;
};

export const SelectedItemCreationRequestSchema = z.object({
  value: z.number(),
});

export type SelectedItemCreationRequest = z.infer<typeof SelectedItemCreationRequestSchema>;

export const SelectedItemRemovalParamsSchema = z.object({
  value: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});

export const SelectionOrderChangeRequestSchema = z.union([
  z.object({
    src: z.number(),
    target: z.number(),
  }),
  z.object({
    src: z.number(),
    target: z.never().optional(),
  }),
  z.object({
    src: z.never().optional(),
    target: z.number(),
  }),
]);

export type SelectionOrderChangeRequest = z.infer<typeof SelectionOrderChangeRequestSchema>;