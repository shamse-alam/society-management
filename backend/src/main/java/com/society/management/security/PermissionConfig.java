package com.society.management.security;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter @Setter
public class PermissionConfig {

    private Map<String, RoleConfig> roles;
    private List<String> publicEndpoints;

    @Getter @Setter
    public static class RoleConfig {
        private String description;
        private List<PermissionEntry> permissions;
    }

    @Getter @Setter
    public static class PermissionEntry {
        private String pattern;
        private Object methods; // Can be "ALL" string or List<String>

        public List<String> getMethodList() {
            if (methods == null || "ALL".equals(methods)) {
                return List.of("GET", "POST", "PUT", "DELETE", "PATCH");
            }
            if (methods instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> list = (List<String>) methods;
                return list;
            }
            return List.of("GET", "POST", "PUT", "DELETE", "PATCH");
        }

        public boolean isAllMethods() {
            return methods == null || "ALL".equals(methods);
        }
    }
}
