import { z } from "astro/zod";

export const GenerateFlashcardsCommandSchema = z.object({
  text: z
    .string()
    .min(1000, { message: "Text must be at least 1000 characters long." })
    .max(10000, { message: "Text must be at most 10000 characters long." }),
});

export type GenerateFlashcardsCommandSchema = z.infer<typeof GenerateFlashcardsCommandSchema>;
