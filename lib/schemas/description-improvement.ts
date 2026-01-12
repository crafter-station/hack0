import { z } from "zod";

export const improvedDescriptionSchema = z.object({
	improvedDescription: z.string(),
});

export type ImprovedDescription = z.infer<typeof improvedDescriptionSchema>;
