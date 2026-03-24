package com.example.HMS_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for smart search system
 */
@Configuration
@ConfigurationProperties(prefix = "hms.search")
public class SearchConfig {

    /**
     * Maximum number of results to return
     */
    private int maxResults = 50;

    /**
     * Minimum score threshold for fuzzy matching (0-100)
     */
    private int fuzzyThreshold = 70;

    /**
     * Minimum score threshold for phonetic matching (0-100)
     */
    private int phoneticThreshold = 80;

    /**
     * Maximum Levenshtein distance for fuzzy matching
     */
    private int maxLevenshteinDistance = 3;

    /**
     * Enable/disable phonetic search
     */
    private boolean phoneticEnabled = true;

    /**
     * Enable/disable fuzzy search
     */
    private boolean fuzzyEnabled = true;

    // Getters and Setters
    public int getMaxResults() {
        return maxResults;
    }

    public void setMaxResults(int maxResults) {
        this.maxResults = maxResults;
    }

    public int getFuzzyThreshold() {
        return fuzzyThreshold;
    }

    public void setFuzzyThreshold(int fuzzyThreshold) {
        this.fuzzyThreshold = fuzzyThreshold;
    }

    public int getPhoneticThreshold() {
        return phoneticThreshold;
    }

    public void setPhoneticThreshold(int phoneticThreshold) {
        this.phoneticThreshold = phoneticThreshold;
    }

    public int getMaxLevenshteinDistance() {
        return maxLevenshteinDistance;
    }

    public void setMaxLevenshteinDistance(int maxLevenshteinDistance) {
        this.maxLevenshteinDistance = maxLevenshteinDistance;
    }

    public boolean isPhoneticEnabled() {
        return phoneticEnabled;
    }

    public void setPhoneticEnabled(boolean phoneticEnabled) {
        this.phoneticEnabled = phoneticEnabled;
    }

    public boolean isFuzzyEnabled() {
        return fuzzyEnabled;
    }

    public void setFuzzyEnabled(boolean fuzzyEnabled) {
        this.fuzzyEnabled = fuzzyEnabled;
    }
}
