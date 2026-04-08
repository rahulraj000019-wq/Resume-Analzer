/**
 * Deterministic Resume Analyzer logic based on ResumeAnalyzer.java
 * This replaces the AI-based analysis with a rule-based approach.
 */

export interface AnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  summary: string;
}

const STOPWORDS = new Set([
  "the", "and", "is", "a", "to", "for", "with", "in", "on", "at", "by", "from", 
  "up", "about", "into", "over", "after", "of", "an", "or", "as", "if", "then", 
  "else", "when", "where", "how", "why", "what", "which", "who", "whom", "this", 
  "that", "these", "those", "it", "its", "they", "them", "their", "our", "we", "you", "your"
]);

// Mapping of synonyms to a canonical skill name
const SYNONYM_MAP: Record<string, string> = {
  "js": "javascript",
  "javascript": "javascript",
  "ml": "machine learning",
  "machine learning": "machine learning",
  "ai": "artificial intelligence",
  "artificial intelligence": "artificial intelligence",
  "py": "python",
  "python": "python",
  "aws": "amazon web services",
  "amazon web services": "amazon web services",
  "gcp": "google cloud platform",
  "google cloud platform": "google cloud platform",
  "ts": "typescript",
  "typescript": "typescript",
  "reactjs": "react",
  "react": "react",
  "native": "react native",
  "react native": "react native",
  "node": "nodejs",
  "nodejs": "nodejs",
  "db": "database",
  "database": "database",
  "sql": "sql",
  "nosql": "nosql",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "java": "java",
  "spring": "spring boot",
  "spring boot": "spring boot",
  "django": "django",
  "flask": "flask",
  "express": "express",
  "mongodb": "mongodb",
  "postgresql": "postgresql",
  "mysql": "mysql",
  "redis": "redis",
  "git": "git",
  "github": "git",
  "ci/cd": "ci/cd",
  "cicd": "ci/cd",
  "agile": "agile",
  "scrum": "scrum",
  "rest": "rest api",
  "rest api": "rest api",
  "graphql": "graphql",
  "microservices": "microservices",
  "unit testing": "unit testing",
  "jest": "unit testing",
  "cypress": "e2e testing",
  "e2e": "e2e testing"
};

// Core skills get higher weight
const CORE_SKILLS = new Set([
  "java", "python", "javascript", "react", "nodejs", "sql", "amazon web services", 
  "docker", "kubernetes", "typescript", "machine learning", "data structures", 
  "algorithms", "spring boot", "microservices"
]);

export function analyzeResumeDeterministic(resumeText: string, jobDescription: string): AnalysisResult {
  const normalize = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9\s+#/]/g, " ");
  };

  const extractSkills = (text: string): Set<string> => {
    const normalizedText = normalize(text);
    const foundSkills = new Set<string>();

    // Check for each canonical skill by looking for its synonyms in the text
    Object.entries(SYNONYM_MAP).forEach(([synonym, canonical]) => {
      // Use word boundary check for synonyms
      const regex = new RegExp(`\\b${synonym}\\b`, "i");
      if (regex.test(normalizedText)) {
        foundSkills.add(canonical);
      }
    });

    return foundSkills;
  };

  const jobSkills = extractSkills(jobDescription);
  const resumeSkills = extractSkills(resumeText);

  const matched: string[] = [];
  const missing: string[] = [];

  let totalWeightedScore = 0;
  let currentWeightedScore = 0;

  // If no skills found in job description, we can't really score it
  if (jobSkills.size === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: ["Please provide a more detailed job description with specific skills."],
      summary: "No specific technical skills were identified in the job description."
    };
  }

  jobSkills.forEach(skill => {
    const weight = CORE_SKILLS.has(skill) ? 3 : 1;
    totalWeightedScore += weight;

    if (resumeSkills.has(skill)) {
      matched.push(skill);
      currentWeightedScore += weight;
    } else {
      missing.push(skill);
    }
  });

  const score = Math.round((currentWeightedScore / totalWeightedScore) * 100);

  const suggestions = missing.length > 0 
    ? missing.slice(0, 5).map(skill => `Consider highlighting your experience with ${skill} or taking a certification course.`)
    : ["Your resume perfectly matches the identified skills! Focus on tailoring your experience descriptions."];

  const summary = `Analysis complete. Your resume matches ${matched.length} out of ${jobSkills.size} identified skills. ${
    score >= 80 ? "Excellent match! You have most of the core competencies required." :
    score >= 50 ? "Good match, but there are some core skills missing that could strengthen your application." :
    "Low match. Consider updating your resume to include more relevant skills mentioned in the job description."
  }`;

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing,
    suggestions,
    summary
  };
}
