import java.util.*;
import java.util.stream.Collectors;

/**
 * Job Resume Analyzer - Core Logic
 * Team: Bug Fixers
 * 
 * This class handles the semantic analysis and scoring of resumes against job descriptions.
 */
public class ResumeAnalyzer {

    public static class AnalysisResult {
        private final int score;
        private final List<String> matchedSkills;
        private final List<String> missingSkills;
        private final List<String> suggestions;
        private final String summary;

        public AnalysisResult(int score, List<String> matched, List<String> missing, List<String> suggestions, String summary) {
            this.score = score;
            this.matchedSkills = matched;
            this.missingSkills = missing;
            this.suggestions = suggestions;
            this.summary = summary;
        }

        // Getters for integration
        public int getScore() { return score; }
        public List<String> getMatchedSkills() { return matchedSkills; }
        public List<String> getMissingSkills() { return missingSkills; }
        public List<String> getSuggestions() { return suggestions; }
        public String getSummary() { return summary; }
    }

    /**
     * Analyzes the resume text against the job description.
     * In the Pro-Visual edition, this is typically called by a web API.
     */
    public AnalysisResult analyze(String resumeText, String jobDescription) {
        Set<String> jobSkills = extractSkills(jobDescription);
        Set<String> resumeSkills = extractSkills(resumeText);

        List<String> matched = jobSkills.stream()
                .filter(resumeSkills::contains)
                .collect(Collectors.toList());

        List<String> missing = jobSkills.stream()
                .filter(skill -> !resumeSkills.contains(skill))
                .collect(Collectors.toList());

        int score = calculateScore(matched.size(), jobSkills.size());
        
        List<String> suggestions = generateSuggestions(missing);
        String summary = generateSummary(matched.size(), missing.size(), score);

        return new AnalysisResult(score, matched, missing, suggestions, summary);
    }

    private Set<String> extractSkills(String text) {
        // Professional skill extraction logic (simplified for demonstration)
        // In production, this would use a predefined dictionary of tech keywords
        return Arrays.stream(text.toLowerCase().split("[\\s,.]+"))
                .filter(word -> word.length() > 3)
                .collect(Collectors.toSet());
    }

    private int calculateScore(int matchedCount, int totalCount) {
        if (totalCount == 0) return 0;
        return (int) ((double) matchedCount / totalCount * 100);
    }

    private List<String> generateSuggestions(List<String> missing) {
        return missing.stream()
                .limit(5)
                .map(skill -> "Consider adding projects or certifications related to " + skill)
                .collect(Collectors.toList());
    }

    private String generateSummary(int matched, int missing, int score) {
        return String.format("Analysis complete. Your resume matches %d key skills with a %d%% overall compatibility. " +
                "There are %d critical gaps identified that should be addressed.", matched, score, missing);
    }
}
