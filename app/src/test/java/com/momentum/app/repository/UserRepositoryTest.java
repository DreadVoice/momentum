package com.momentum.app.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import com.momentum.app.entity.User;

class UserRepositoryTest extends DataJpaTestBase {

    @Autowired
    private UserRepository userRepository;

    private User newUser(String username, String email) {
        return userRepository.save(User.builder()
                .username(username).email(email).password("hash").build());
    }

    @BeforeEach
    void seed() {
        newUser("alice", "alice@example.com");
    }

    @Test
    void findByUsername_matchesExactly() {
        assertThat(userRepository.findByUsername("alice")).isPresent();
        assertThat(userRepository.findByUsername("bob")).isEmpty();
    }

    @Test
    void findByEmail_matchesExactly() {
        assertThat(userRepository.findByEmail("alice@example.com")).isPresent();
        assertThat(userRepository.findByEmail("nobody@example.com")).isEmpty();
    }

    @Test
    void existsChecksReportRegisteredIdentifiers() {
        assertThat(userRepository.existsByUsername("alice")).isTrue();
        assertThat(userRepository.existsByEmail("alice@example.com")).isTrue();
        assertThat(userRepository.existsByUsername("bob")).isFalse();
        assertThat(userRepository.existsByEmail("bob@example.com")).isFalse();
    }

    @Test
    void usernameIsUnique() {
        assertThatThrownBy(() -> {
            newUser("alice", "other@example.com");
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void emailIsUnique() {
        assertThatThrownBy(() -> {
            newUser("other", "alice@example.com");
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void timestampsAndWidenedProfilePhotoPersist() {
        String longUrl = "https://cdn.example.com/" + "a".repeat(450) + ".png";
        User saved = userRepository.save(User.builder()
                .username("carol").email("carol@example.com").password("hash")
                .profilePhoto(longUrl).build());

        userRepository.flush();
        User reloaded = userRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getProfilePhoto()).isEqualTo(longUrl);
        assertThat(reloaded.getCreatedAt()).isNotNull();
    }
}
