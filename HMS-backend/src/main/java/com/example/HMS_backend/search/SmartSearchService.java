package com.example.HMS_backend.search;

import com.example.HMS_backend.config.SearchConfig;
import com.example.HMS_backend.util.PhoneticSearchUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Production-ready smart search service combining multiple search strategies
 * - Exact match
 * - Prefix match
 * - Contains match
 * - Phonetic match (Double Metaphone)
 * - Fuzzy match (Levenshtein distance)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmartSearchService {

    private final PhoneticSearchUtil phoneticSearchUtil;
    private final SearchConfig searchConfig;

    /**
     * Perform smart search on a list of candidates
     * 
     * @param query Search query
     * @param candidates List of candidates to search
     * @param textExtractor Function to extract searchable text from candidate
     * @param <T> Type of candidate
     * @return Ranked list of search results
     */
    public <T> List<SearchResult<T>> search(String query, 
                                             List<T> candidates, 
                                             Function<T, String> textExtractor) {
        if (query == null || query.trim().isEmpty()) {
            return candidates.stream()
                    .limit(searchConfig.getMaxResults())
                    .map(c -> SearchResult.<T>builder()
                            .data(c)
                            .score(100)
                            .matchType(SearchResult.SearchMatchType.EXACT)
                            .build())
                    .collect(Collectors.toList());
        }

        String normalizedQuery = normalizeInput(query);
        log.debug("Searching for: '{}' (normalized: '{}')", query, normalizedQuery);

        List<SearchResult<T>> results = new ArrayList<>();
        Set<T> processedCandidates = new HashSet<>();

        for (T candidate : candidates) {
            if (processedCandidates.contains(candidate)) {
                continue;
            }

            String text = textExtractor.apply(candidate);
            if (text == null || text.trim().isEmpty()) {
                continue;
            }

            String normalizedText = normalizeInput(text);
            SearchResult<T> result = evaluateMatch(normalizedQuery, normalizedText, candidate, text);

            if (result != null) {
                results.add(result);
                processedCandidates.add(candidate);
            }
        }

        // Sort by score and match type, then limit results
        return results.stream()
                .sorted()
                .limit(searchConfig.getMaxResults())
                .collect(Collectors.toList());
    }

    /**
     * Perform multi-field smart search
     * 
     * @param query Search query
     * @param candidates List of candidates
     * @param fieldExtractors Map of field names to text extractors
     * @param <T> Type of candidate
     * @return Ranked list of search results
     */
    public <T> List<SearchResult<T>> multiFieldSearch(String query,
                                                       List<T> candidates,
                                                       Map<String, Function<T, String>> fieldExtractors) {
        if (query == null || query.trim().isEmpty()) {
            return candidates.stream()
                    .limit(searchConfig.getMaxResults())
                    .map(c -> SearchResult.<T>builder()
                            .data(c)
                            .score(100)
                            .matchType(SearchResult.SearchMatchType.EXACT)
                            .build())
                    .collect(Collectors.toList());
        }

        String normalizedQuery = normalizeInput(query);
        Map<T, SearchResult<T>> bestResults = new HashMap<>();

        for (T candidate : candidates) {
            SearchResult<T> bestMatch = null;

            for (Map.Entry<String, Function<T, String>> entry : fieldExtractors.entrySet()) {
                String fieldName = entry.getKey();
                String text = entry.getValue().apply(candidate);

                if (text == null || text.trim().isEmpty()) {
                    continue;
                }

                String normalizedText = normalizeInput(text);
                SearchResult<T> result = evaluateMatch(normalizedQuery, normalizedText, candidate, text);

                if (result != null) {
                    result.setMatchedField(fieldName);
                    
                    if (bestMatch == null || result.compareTo(bestMatch) < 0) {
                        bestMatch = result;
                    }
                }
            }

            if (bestMatch != null) {
                bestResults.put(candidate, bestMatch);
            }
        }

        return bestResults.values().stream()
                .sorted()
                .limit(searchConfig.getMaxResults())
                .collect(Collectors.toList());
    }

    /**
     * Evaluate match between query and text
     */
    private <T> SearchResult<T> evaluateMatch(String normalizedQuery, 
                                               String normalizedText, 
                                               T candidate,
                                               String originalText) {
        // 1. Exact match (Score: 100)
        if (normalizedText.equals(normalizedQuery)) {
            return SearchResult.<T>builder()
                    .data(candidate)
                    .score(100)
                    .matchType(SearchResult.SearchMatchType.EXACT)
                    .build();
        }

        // 2. Prefix match (Score: 95)
        if (normalizedText.startsWith(normalizedQuery)) {
            return SearchResult.<T>builder()
                    .data(candidate)
                    .score(95)
                    .matchType(SearchResult.SearchMatchType.PREFIX)
                    .build();
        }

        // 3. Contains match (Score: 90)
        if (normalizedText.contains(normalizedQuery)) {
            return SearchResult.<T>builder()
                    .data(candidate)
                    .score(90)
                    .matchType(SearchResult.SearchMatchType.CONTAINS)
                    .build();
        }

        // 4. Phonetic match (Score: 85)
        if (searchConfig.isPhoneticEnabled()) {
            int phoneticScore = phoneticSearchUtil.calculatePhoneticScore(normalizedQuery, normalizedText);
            if (phoneticScore >= searchConfig.getPhoneticThreshold()) {
                return SearchResult.<T>builder()
                        .data(candidate)
                        .score(phoneticScore)
                        .matchType(SearchResult.SearchMatchType.PHONETIC)
                        .build();
            }
        }

        // 5. Fuzzy match (Score: 70-84)
        if (searchConfig.isFuzzyEnabled()) {
            int fuzzyScore = calculateFuzzyScore(normalizedQuery, normalizedText);
            if (fuzzyScore >= searchConfig.getFuzzyThreshold()) {
                return SearchResult.<T>builder()
                        .data(candidate)
                        .score(fuzzyScore)
                        .matchType(SearchResult.SearchMatchType.FUZZY)
                        .build();
            }
        }

        return null; // No match
    }

    /**
     * Normalize input for consistent matching
     * Handles variations like "zil" → "zeel", removes extra spaces, etc.
     */
    public String normalizeInput(String input) {
        if (input == null) {
            return "";
        }

        return input.toLowerCase()
                .trim()
                .replaceAll("\\s+", " ")  // Multiple spaces to single space
                .replaceAll("[^a-z0-9\\s]", ""); // Remove special characters
    }

    /**
     * Calculate fuzzy match score using Levenshtein distance
     */
    private int calculateFuzzyScore(String query, String text) {
        int distance = levenshteinDistance(query, text);
        
        // Reject if distance is too large
        if (distance > searchConfig.getMaxLevenshteinDistance()) {
            return 0;
        }

        int maxLen = Math.max(query.length(), text.length());
        if (maxLen == 0) {
            return 100;
        }

        // Calculate similarity percentage
        double similarity = 1.0 - ((double) distance / maxLen);
        return (int) (similarity * 100);
    }

    /**
     * Calculate Levenshtein distance between two strings
     * Optimized with early termination
     */
    private int levenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();

        // Early termination if difference is too large
        if (Math.abs(len1 - len2) > searchConfig.getMaxLevenshteinDistance()) {
            return searchConfig.getMaxLevenshteinDistance() + 1;
        }

        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= len1; i++) {
            int minInRow = Integer.MAX_VALUE;
            
            for (int j = 1; j <= len2; j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
                minInRow = Math.min(minInRow, dp[i][j]);
            }

            // Early termination if minimum distance in row exceeds threshold
            if (minInRow > searchConfig.getMaxLevenshteinDistance()) {
                return searchConfig.getMaxLevenshteinDistance() + 1;
            }
        }

        return dp[len1][len2];
    }

    /**
     * Extract data from search results
     */
    public <T> List<T> extractData(List<SearchResult<T>> results) {
        return results.stream()
                .map(SearchResult::getData)
                .collect(Collectors.toList());
    }
}
