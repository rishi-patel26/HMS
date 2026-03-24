package com.example.HMS_backend.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.language.DoubleMetaphone;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Utility class for phonetic search using Double Metaphone algorithm
 * Handles misspellings and variations in pronunciation
 */
@Component
@Slf4j
public class PhoneticSearchUtil {

    private final DoubleMetaphone doubleMetaphone;

    public PhoneticSearchUtil() {
        this.doubleMetaphone = new DoubleMetaphone();
        this.doubleMetaphone.setMaxCodeLen(6); // Longer codes for better accuracy
    }

    /**
     * Generate primary phonetic key for a string
     */
    public String generatePhoneticKey(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "";
        }

        String normalized = normalizeText(text);
        String key = doubleMetaphone.doubleMetaphone(normalized);
        
        log.debug("Generated phonetic key for '{}': '{}'", text, key);
        return key != null ? key : "";
    }

    /**
     * Generate alternate phonetic key for a string
     */
    public String generateAlternatePhoneticKey(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "";
        }

        String normalized = normalizeText(text);
        String key = doubleMetaphone.doubleMetaphone(normalized, true);
        
        return key != null ? key : "";
    }

    /**
     * Generate phonetic keys for first name, last name, and full name
     */
    public PhoneticKeys generateNamePhoneticKeys(String firstName, String lastName) {
        PhoneticKeys keys = new PhoneticKeys();
        
        if (firstName != null && !firstName.trim().isEmpty()) {
            keys.firstNameKey = generatePhoneticKey(firstName);
        }
        
        if (lastName != null && !lastName.trim().isEmpty()) {
            keys.lastNameKey = generatePhoneticKey(lastName);
        }
        
        if (firstName != null && lastName != null) {
            String fullName = firstName.trim() + " " + lastName.trim();
            keys.fullNameKey = generatePhoneticKey(fullName);
        }
        
        return keys;
    }

    /**
     * Check if two strings match phonetically
     */
    public boolean matchesPhonetically(String text1, String text2) {
        if (text1 == null || text2 == null) {
            return false;
        }

        String key1 = generatePhoneticKey(text1);
        String key2 = generatePhoneticKey(text2);

        if (key1.isEmpty() || key2.isEmpty()) {
            return false;
        }

        // Check primary keys
        if (key1.equals(key2)) {
            return true;
        }

        // Check alternate keys
        String alt1 = generateAlternatePhoneticKey(text1);
        String alt2 = generateAlternatePhoneticKey(text2);

        return (!alt1.isEmpty() && alt1.equals(key2)) || 
               (!alt2.isEmpty() && key1.equals(alt2)) ||
               (!alt1.isEmpty() && !alt2.isEmpty() && alt1.equals(alt2));
    }

    /**
     * Calculate phonetic similarity score (0-100)
     */
    public int calculatePhoneticScore(String query, String text) {
        if (query == null || text == null) {
            return 0;
        }

        String queryKey = generatePhoneticKey(query);
        String textKey = generatePhoneticKey(text);

        if (queryKey.isEmpty() || textKey.isEmpty()) {
            return 0;
        }

        // Exact phonetic match
        if (queryKey.equals(textKey)) {
            return 85;
        }

        // Check alternate keys
        String queryAlt = generateAlternatePhoneticKey(query);
        String textAlt = generateAlternatePhoneticKey(text);

        if ((!queryAlt.isEmpty() && queryAlt.equals(textKey)) ||
            (!textAlt.isEmpty() && queryKey.equals(textAlt))) {
            return 83;
        }

        if (!queryAlt.isEmpty() && !textAlt.isEmpty() && queryAlt.equals(textAlt)) {
            return 81;
        }

        // Partial phonetic match (one key is substring of another)
        if (queryKey.length() >= 3 && textKey.length() >= 3) {
            if (textKey.startsWith(queryKey) || queryKey.startsWith(textKey)) {
                return 80;
            }
        }

        return 0;
    }

    /**
     * Search for phonetically matching items in a list
     */
    public <T> List<T> phoneticSearch(String query, 
                                       List<T> items, 
                                       java.util.function.Function<T, String> textExtractor) {
        if (query == null || query.trim().isEmpty() || items == null) {
            return new ArrayList<>();
        }

        String queryKey = generatePhoneticKey(query);
        if (queryKey.isEmpty()) {
            return new ArrayList<>();
        }

        List<T> matches = new ArrayList<>();
        
        for (T item : items) {
            String text = textExtractor.apply(item);
            if (text != null && matchesPhonetically(query, text)) {
                matches.add(item);
            }
        }

        return matches;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    public int levenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return Integer.MAX_VALUE;
        }

        int len1 = s1.length();
        int len2 = s2.length();

        if (len1 == 0) return len2;
        if (len2 == 0) return len1;

        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }

        return dp[len1][len2];
    }

    /**
     * Normalize text for consistent processing
     */
    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }

        return text.toLowerCase()
                .trim()
                .replaceAll("\\s+", " ")
                .replaceAll("[^a-z0-9\\s]", "");
    }

    /**
     * Data class to hold phonetic keys for names
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhoneticKeys {
        public String firstNameKey = "";
        public String lastNameKey = "";
        public String fullNameKey = "";
    }
}
