package com.example.HMS_backend.security.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request,
                                               HttpServletResponse response) {
        AuthResponse authResponse = authService.authenticate(request);
        setAuthCookies(response, authResponse.getAccessToken(), authResponse.getRefreshToken());
        // Return user info only — tokens are in httpOnly cookies
        return ResponseEntity.ok(AuthResponse.builder()
                .username(authResponse.getUsername())
                .role(authResponse.getRole())
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                 HttpServletResponse response) {
        String refreshToken = extractCookieValue(request, "refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }
        AuthResponse authResponse = authService.refreshToken(refreshToken);
        setAuthCookies(response, authResponse.getAccessToken(), authResponse.getRefreshToken());
        return ResponseEntity.ok(AuthResponse.builder()
                .username(authResponse.getUsername())
                .role(authResponse.getRole())
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = extractBearerToken(request);
        if (accessToken == null) {
            accessToken = extractCookieValue(request, "accessToken");
        }
        if (accessToken != null) {
            authService.logout(accessToken);
        }
        clearAuthCookies(response);
        return ResponseEntity.ok().build();
    }

    private void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(false);  // JS-readable so interceptor can send as Bearer header
        accessCookie.setSecure(cookieSecure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge((int) (jwtExpiration / 1000));
        accessCookie.setAttribute("SameSite", "Strict");
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(cookieSecure);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge((int) (refreshExpiration / 1000));
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("accessToken", "");
        accessCookie.setHttpOnly(false);
        accessCookie.setSecure(cookieSecure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        accessCookie.setAttribute("SameSite", "Strict");
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(cookieSecure);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge(0);
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
