import { z } from "zod";

import { THEMES } from "@/lib/constants";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(200),
});

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  image: z
    .string()
    .trim()
    .url("Profile image must be a valid URL")
    .max(2048)
    .nullable()
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(128),
  newPassword: passwordSchema,
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(THEMES).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  language: z.string().trim().min(2).max(12).optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm").max(128),
});
