package com.example.dms.help;

public enum HelpHistorySort {
    NEWEST("createdAt"),
    ACTOR("actorFullName"),
    QUESTION("question"),
    ANSWER("answer"),
    SOURCE("answerSource"),
    STATUS("blocked");

    private final String property;

    HelpHistorySort(String property) {
        this.property = property;
    }

    public String property() {
        return property;
    }
}
