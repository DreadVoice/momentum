package com.momentum.app.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import com.momentum.app.entity.Category;
import com.momentum.app.entity.User;

class CategoryRepositoryTest extends DataJpaTestBase {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;

    private User alice;
    private User bob;

    private User newUser(String name) {
        return userRepository.save(User.builder()
                .username(name).email(name + "@example.com").password("hash").build());
    }

    private Category newCategory(User owner, String name) {
        return categoryRepository.save(Category.builder().name(name).user(owner).build());
    }

    @BeforeEach
    void seed() {
        alice = newUser("alice");
        bob = newUser("bob");
    }

    @Test
    void findByUserId_returnsOnlyThatUsersCategories() {
        newCategory(alice, "Work");
        newCategory(alice, "Home");
        newCategory(bob, "Work");

        assertThat(categoryRepository.findByUserId(alice.getId()))
                .extracting(Category::getName).containsExactlyInAnyOrder("Work", "Home");
    }

    @Test
    void findByUserIdAndName_isScopedToOwner() {
        newCategory(alice, "Work");

        assertThat(categoryRepository.findByUserIdAndName(alice.getId(), "Work")).isPresent();
        assertThat(categoryRepository.findByUserIdAndName(bob.getId(), "Work")).isEmpty();
    }

    @Test
    void existsByUserIdAndName_isScopedToOwner() {
        newCategory(alice, "Work");

        assertThat(categoryRepository.existsByUserIdAndName(alice.getId(), "Work")).isTrue();
        assertThat(categoryRepository.existsByUserIdAndName(bob.getId(), "Work")).isFalse();
        assertThat(categoryRepository.existsByUserIdAndName(alice.getId(), "Missing")).isFalse();
    }

    @Test
    void differentUsersMayShareACategoryName() {
        newCategory(alice, "Work");
        newCategory(bob, "Work");

        categoryRepository.flush();

        assertThat(categoryRepository.findAll()).hasSize(2);
    }

    @Test
    void sameUserCannotReuseACategoryName() {
        newCategory(alice, "Work");
        categoryRepository.flush();

        assertThatThrownBy(() -> {
            newCategory(alice, "Work");
            categoryRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
