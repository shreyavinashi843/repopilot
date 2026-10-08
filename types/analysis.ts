import { z } from "zod";

const scoreSchema = z.number().int().min(0).max(100);

const categorySchema = z.object({
  score: scoreSchema,
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const analysisSchema = z.object({
  summary: z.string().min(1),
  overallScore: scoreSchema,
  categories: z.object({
    codeQuality: categorySchema,
    architecture: categorySchema,
    security: categorySchema,
    testing: categorySchema,
    documentation: categorySchema,
    maintainability: categorySchema,
  }),
  priorityActions: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type Analysis = z.infer<typeof analysisSchema>;

export const analyzeRequestSchema = z.object({
  repositoryUrl: z.string().min(1, "Repository URL is required."),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export interface RepositoryInfo {
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  stars: number;
  language: string | null;
  htmlUrl: string;
}

export interface AnalyzeResponse {
  repository: RepositoryInfo;
  analysis: Analysis;
  metadata: {
    filesAnalyzed: number;
    truncated: boolean;
    analyzedPaths: string[];
  };
}

export const CATEGORY_LABELS: Record<keyof Analysis["categories"], string> = {
  codeQuality: "Code Quality",
  architecture: "Architecture",
  security: "Security",
  testing: "Testing",
  documentation: "Documentation",
  maintainability: "Maintainability",
};
