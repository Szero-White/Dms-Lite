package com.example.dms.common.code;

public enum BusinessCodeType {
    PRODUCT("PRD", 6);

    private final String prefix;
    private final int width;

    BusinessCodeType(String prefix, int width) {
        this.prefix = prefix;
        this.width = width;
    }

    public String prefix() {
        return prefix;
    }

    public int width() {
        return width;
    }
}
