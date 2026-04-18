package com.society.management.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);

    private PermissionConfig config;

    @PostConstruct
    public void init() {
        loadPermissions();
    }

    public void loadPermissions() {
        try {
            ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
            InputStream is = new ClassPathResource("permissions.yml").getInputStream();

            // Read as raw map first, then map to our config
            @SuppressWarnings("unchecked")
            Map<String, Object> raw = mapper.readValue(is, Map.class);

            config = new PermissionConfig();

            // Parse roles
            @SuppressWarnings("unchecked")
            Map<String, Object> rolesMap = (Map<String, Object>) raw.get("roles");
            Map<String, PermissionConfig.RoleConfig> roles = new LinkedHashMap<>();

            if (rolesMap != null) {
                for (Map.Entry<String, Object> entry : rolesMap.entrySet()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> roleData = (Map<String, Object>) entry.getValue();
                    PermissionConfig.RoleConfig roleConfig = new PermissionConfig.RoleConfig();
                    roleConfig.setDescription((String) roleData.get("description"));

                    List<PermissionConfig.PermissionEntry> permissions = new ArrayList<>();
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> permList = (List<Map<String, Object>>) roleData.get("permissions");
                    if (permList != null) {
                        for (Map<String, Object> perm : permList) {
                            PermissionConfig.PermissionEntry pe = new PermissionConfig.PermissionEntry();
                            pe.setPattern((String) perm.get("pattern"));
                            pe.setMethods(perm.get("methods"));
                            permissions.add(pe);
                        }
                    }
                    roleConfig.setPermissions(permissions);
                    roles.put(entry.getKey(), roleConfig);
                }
            }
            config.setRoles(roles);

            // Parse public endpoints
            @SuppressWarnings("unchecked")
            List<String> publicEndpoints = (List<String>) raw.get("public");
            config.setPublicEndpoints(publicEndpoints != null ? publicEndpoints : List.of());

            log.info("Loaded permissions.yml: {} roles, {} public endpoints",
                    config.getRoles().size(), config.getPublicEndpoints().size());

        } catch (Exception e) {
            log.error("Failed to load permissions.yml, using empty config", e);
            config = new PermissionConfig();
            config.setRoles(Map.of());
            config.setPublicEndpoints(List.of());
        }
    }

    /**
     * Configure Spring Security authorization rules from the YAML config.
     */
    public void configureAuthorization(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {

        // 1. Public endpoints
        for (String pattern : config.getPublicEndpoints()) {
            auth.requestMatchers(pattern).permitAll();
        }
        auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

        // 2. Collect all unique patterns and the roles that can access them
        // We need to group by (pattern, method) → set of roles
        Map<String, Map<String, Set<String>>> patternMethodRoles = new LinkedHashMap<>();

        for (Map.Entry<String, PermissionConfig.RoleConfig> roleEntry : config.getRoles().entrySet()) {
            String roleName = roleEntry.getKey();
            PermissionConfig.RoleConfig roleConfig = roleEntry.getValue();

            if (roleConfig.getPermissions() == null) continue;

            for (PermissionConfig.PermissionEntry perm : roleConfig.getPermissions()) {
                patternMethodRoles
                        .computeIfAbsent(perm.getPattern(), k -> new LinkedHashMap<>());

                if (perm.isAllMethods()) {
                    // Add to a special "ALL" key
                    patternMethodRoles.get(perm.getPattern())
                            .computeIfAbsent("ALL", k -> new LinkedHashSet<>())
                            .add(roleName);
                } else {
                    for (String method : perm.getMethodList()) {
                        patternMethodRoles.get(perm.getPattern())
                                .computeIfAbsent(method.toUpperCase(), k -> new LinkedHashSet<>())
                                .add(roleName);
                    }
                }
            }
        }

        // 3. Apply the rules — more specific patterns first
        // Sort patterns: longer/more-specific first
        List<String> sortedPatterns = new ArrayList<>(patternMethodRoles.keySet());
        sortedPatterns.sort((a, b) -> {
            // Count path segments
            long segA = a.chars().filter(c -> c == '/').count();
            long segB = b.chars().filter(c -> c == '/').count();
            if (segA != segB) return Long.compare(segB, segA);
            // Wildcard patterns last
            if (a.contains("**") && !b.contains("**")) return 1;
            if (!a.contains("**") && b.contains("**")) return -1;
            return b.length() - a.length();
        });

        for (String pattern : sortedPatterns) {
            Map<String, Set<String>> methodRoles = patternMethodRoles.get(pattern);

            if (methodRoles.containsKey("ALL")) {
                // If any role has ALL methods, merge with specific method roles
                Set<String> allMethodRoles = new LinkedHashSet<>(methodRoles.get("ALL"));
                allMethodRoles.add("ADMIN"); // ADMIN always has access
                String[] roles = allMethodRoles.toArray(new String[0]);
                auth.requestMatchers(pattern).hasAnyRole(roles);
            } else {
                // Apply per-method rules
                for (Map.Entry<String, Set<String>> me : methodRoles.entrySet()) {
                    HttpMethod httpMethod = HttpMethod.valueOf(me.getKey());
                    Set<String> roleSet = new LinkedHashSet<>(me.getValue());
                    roleSet.add("ADMIN"); // ADMIN always has access
                    String[] roles = roleSet.toArray(new String[0]);
                    auth.requestMatchers(httpMethod, pattern).hasAnyRole(roles);
                }
            }
        }

        // 4. Everything else requires authentication
        auth.anyRequest().authenticated();
    }

    /**
     * Get all roles and their descriptions (for admin UI / frontend).
     */
    public Map<String, String> getAllRoles() {
        Map<String, String> result = new LinkedHashMap<>();
        if (config.getRoles() != null) {
            config.getRoles().forEach((name, rc) -> result.put(name, rc.getDescription()));
        }
        return result;
    }

    /**
     * Get permissions for a specific role.
     */
    public List<Map<String, Object>> getRolePermissions(String role) {
        if (config.getRoles() == null || !config.getRoles().containsKey(role)) {
            return List.of();
        }
        PermissionConfig.RoleConfig rc = config.getRoles().get(role);
        if (rc.getPermissions() == null) return List.of();

        return rc.getPermissions().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pattern", p.getPattern());
            m.put("methods", p.isAllMethods() ? "ALL" : p.getMethodList());
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * Get full permission config for the admin API.
     */
    public PermissionConfig getConfig() {
        return config;
    }

    /**
     * Check if a role has access to a specific pattern and method.
     */
    public boolean hasPermission(String role, String pattern, String method) {
        if ("ADMIN".equals(role)) return true;
        if (config.getRoles() == null || !config.getRoles().containsKey(role)) return false;

        PermissionConfig.RoleConfig rc = config.getRoles().get(role);
        if (rc.getPermissions() == null) return false;

        AntPathRequestMatcher matcher;
        for (PermissionConfig.PermissionEntry perm : rc.getPermissions()) {
            if (perm.isAllMethods() || perm.getMethodList().contains(method.toUpperCase())) {
                matcher = new AntPathRequestMatcher(perm.getPattern());
                // Simple string match for checking (not full request matching)
                if (pattern.equals(perm.getPattern()) || matchesAntPattern(pattern, perm.getPattern())) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean matchesAntPattern(String path, String pattern) {
        // Simple ant pattern matching
        if (pattern.endsWith("/**")) {
            String prefix = pattern.substring(0, pattern.length() - 3);
            return path.startsWith(prefix);
        }
        return path.equals(pattern);
    }
}
