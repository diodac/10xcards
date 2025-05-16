import { z } from "zod";

export const CreateDeckSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(128, { message: "Name cannot exceed 128 characters" }),
});
