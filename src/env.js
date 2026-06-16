import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.SKIP_ENV_VALIDATION === 'true';

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success && !isBuild) {
  console.error("❌ Invalid frontend environment variables:\n", JSON.stringify(envParsed.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

if (!envParsed.success && isBuild) {
  console.warn("⚠️ Warning: Invalid environment variables detected during build. Bypassing validation because this is a build step.");
}

export const env = envParsed.success ? envParsed.data : process.env;
