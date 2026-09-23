import { z } from 'zod';

const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
  skillsUsed: z.array(z.string()),
});

const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['language', 'framework', 'cloud', 'database', 'ai_ml', 'devops', 'soft', 'domain']),
  level: z.enum(['basic', 'intermediate', 'advanced', 'expert']),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  year: z.string(),
});

const remotePolicySchema = z.enum(['REMOTE_OK', 'HYBRID_OK', 'ONSITE_ONLY']);

export const profilePatchSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  narrative: z.string().nullable().optional(),
  experiences: z.array(experienceSchema).optional(),
  skills: z.array(skillSchema).optional(),
  education: z.array(educationSchema).optional(),
  targetRoles: z.array(z.string()).optional(),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  remotePolicy: remotePolicySchema.optional(),
  language: z.string().optional(),
});

export const profilePutSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  narrative: z.string().nullable().optional(),
  experiences: z.array(experienceSchema).optional(),
  skills: z.array(skillSchema).optional(),
  education: z.array(educationSchema).optional(),
  cvRaw: z.string().nullable().optional(),
  targetRoles: z.array(z.string()).optional(),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  remotePolicy: remotePolicySchema.optional(),
});
