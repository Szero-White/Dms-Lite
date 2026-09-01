package com.example.dms.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceValidationTest {

    @Test
    void rejectsDefaultJwtSecretInProduction() {
        JwtService jwtService = jwtService(
            new MockEnvironment().withProperty("spring.profiles.active", "prod"),
            "dms-lite-secret-key-must-be-at-least-32-characters",
            180
        );

        assertThatThrownBy(jwtService::validateSecret)
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("APP_JWT_SECRET must be changed for docker/production deployments");
    }

    @Test
    void rejectsPlaceholderJwtSecretInProduction() {
        JwtService jwtService = jwtService(
            new MockEnvironment().withProperty("spring.profiles.active", "prod"),
            "replace-with-strong-random-64-char-secret",
            180
        );

        assertThatThrownBy(jwtService::validateSecret)
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("APP_JWT_SECRET must be changed for docker/production deployments");
    }

    @Test
    void rejectsShortJwtSecret() {
        JwtService jwtService = jwtService(new MockEnvironment(), "too-short", 180);

        assertThatThrownBy(jwtService::validateSecret)
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("APP_JWT_SECRET must be at least 32 characters");
    }

    @Test
    void acceptsStrongJwtSecretInProduction() {
        JwtService jwtService = jwtService(
            new MockEnvironment().withProperty("spring.profiles.active", "prod"),
            "strong-production-secret-with-more-than-32-characters",
            30
        );

        assertThatCode(jwtService::validateSecret).doesNotThrowAnyException();
    }

    @Test
    void rejectsNonPositiveJwtExpiration() {
        JwtService jwtService = jwtService(
            new MockEnvironment(),
            "local-secret-with-more-than-32-characters",
            0
        );

        assertThatThrownBy(jwtService::validateSecret)
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("APP_JWT_MINUTES must be greater than zero");
    }

    private JwtService jwtService(MockEnvironment environment, String secret, long minutes) {
        JwtService jwtService = new JwtService(environment);
        ReflectionTestUtils.setField(jwtService, "secret", secret);
        ReflectionTestUtils.setField(jwtService, "minutes", minutes);
        return jwtService;
    }
}