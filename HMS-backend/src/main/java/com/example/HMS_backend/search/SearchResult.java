package com.example.HMS_backend.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic search result wrapper with scoring and ranking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult<T> implements Comparable<SearchResult<T>> {

    private T data;
    private int score;
    private SearchMatchType matchType;
    private String matchedField;

    @Override
    public int compareTo(SearchResult<T> other) {
        // Sort by score descending, then by match type priority
        int scoreCompare = Integer.compare(other.score, this.score);
        if (scoreCompare != 0) {
            return scoreCompare;
        }
        return Integer.compare(this.matchType.getPriority(), other.matchType.getPriority());
    }

    /**
     * Types of search matches with priority ordering
     */
    public enum SearchMatchType {
        EXACT(1),           // Exact match
        PREFIX(2),          // Starts with query
        CONTAINS(3),        // Contains query
        PHONETIC(4),        // Phonetic match
        FUZZY(5);           // Fuzzy/typo match

        private final int priority;

        SearchMatchType(int priority) {
            this.priority = priority;
        }

        public int getPriority() {
            return priority;
        }
    }
}
