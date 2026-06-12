import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url("Must be a valid MongoDB URI"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error("❌ Invalid frontend environment variables:\n", JSON.stringify(envParsed.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

export const env = envParsed.data;
