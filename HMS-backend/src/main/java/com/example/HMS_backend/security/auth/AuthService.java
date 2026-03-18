package com.example.HMS_backend.security.auth;


import com.example.HMS_backend.entity.User;
import com.example.HMS_backend.exception.InvalidTokenException;
import com.example.HMS_backend.exception.ResourceNotFoundException;
import com.example.HMS_backend.repository.UserRepository;
import com.example.HMS_backend.security.jwt.JwtService;
import com.example.HMS_backend.security.redis.TokenBlacklistService;
import com.example.HMS_backend.security.token.RefreshToken;
import com.example.HMS_backend.security.token.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthResponse authenticate(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw new IllegalStateException("Account is disabled. Please contact administrator.");
        }
        
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUsername()));
        
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getUsername());
        
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        try {
            RefreshToken token = refreshTokenService.verifyExpiration(
                    refreshTokenService.findByToken(refreshToken)
            );
            
                User user = userRepository.findByUsername(token.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + token.getUsername()));
            
            String accessToken = jwtService.generateToken(user);
            
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .username(user.getUsername())
                    .role(user.getRole())
                    .build();
        } catch (RuntimeException e) {
            throw new InvalidTokenException("Invalid or expired refresh token", e);
        }
    }

    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
    }
}
