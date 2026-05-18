export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  bullets: string[];
  skillsUsed: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'cloud' | 'database' | 'ai_ml' | 'devops' | 'soft' | 'domain';
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface ParsedImport {
  experiences: Omit<Experience, 'id'>[];
  skills: Omit<Skill, 'id'>[];
  education: Omit<Education, 'id'>[];
  summary: string | null;
}

export interface ProfileData {
  fullName: string;
  email: string;
  location: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  narrative: string | null;
  experiences: Omit<Experience, 'id'>[];
  skills: Omit<Skill, 'id'>[];
  education: Omit<Education, 'id'>[];
  targetRoles: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  remotePolicy: 'REMOTE_OK' | 'HYBRID_OK' | 'ONSITE_ONLY';
  language: string;
}
