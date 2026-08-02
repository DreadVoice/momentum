package com.momentum.app.repository;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.momentum.app.entity.Category;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

class TaskRepositoryTest extends DataJpaTestBase {

    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    private User alice;
    private User bob;
    private Category work;

    private User newUser(String name) {
        return userRepository.save(User.builder()
                .username(name).email(name + "@example.com").password("hash").build());
    }

    private Task newTask(User owner, String title, TaskStatus status, TaskPriority priority,
            LocalDate dueDate, Category category) {
        return taskRepository.save(Task.builder()
                .title(title).status(status).priority(priority)
                .dueDate(dueDate).user(owner).category(category).build());
    }

    @BeforeEach
    void seed() {
        alice = newUser("alice");
        bob = newUser("bob");
        work = categoryRepository.save(Category.builder().name("Work").user(alice).build());
    }

    @Test
    void findByUserId_returnsOnlyThatUsersTasks() {
        newTask(alice, "Alice A", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(alice, "Alice B", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(bob, "Bob A", TaskStatus.PENDING, TaskPriority.LOW, null, null);

        List<Task> alicesTasks = taskRepository.findByUserId(alice.getId());

        assertThat(alicesTasks).hasSize(2).extracting(Task::getTitle)
                .containsExactlyInAnyOrder("Alice A", "Alice B");
    }

    @Test
    void findByUserIdAndStatus_filtersByStatusAndOwner() {
        newTask(alice, "Pending", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(alice, "Done", TaskStatus.COMPLETED, TaskPriority.LOW, null, null);
        newTask(bob, "Bob done", TaskStatus.COMPLETED, TaskPriority.LOW, null, null);

        assertThat(taskRepository.findByUserIdAndStatus(alice.getId(), TaskStatus.COMPLETED))
                .extracting(Task::getTitle).containsExactly("Done");
    }

    @Test
    void findByUserIdAndPriority_filtersByPriorityAndOwner() {
        newTask(alice, "High", TaskStatus.PENDING, TaskPriority.HIGH, null, null);
        newTask(alice, "Low", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(bob, "Bob high", TaskStatus.PENDING, TaskPriority.HIGH, null, null);

        assertThat(taskRepository.findByUserIdAndPriority(alice.getId(), TaskPriority.HIGH))
                .extracting(Task::getTitle).containsExactly("High");
    }

    @Test
    void findByUserIdAndCategoryId_filtersByCategoryAndOwner() {
        newTask(alice, "In work", TaskStatus.PENDING, TaskPriority.LOW, null, work);
        newTask(alice, "Uncategorised", TaskStatus.PENDING, TaskPriority.LOW, null, null);

        assertThat(taskRepository.findByUserIdAndCategoryId(alice.getId(), work.getId()))
                .extracting(Task::getTitle).containsExactly("In work");
        assertThat(taskRepository.findByUserIdAndCategoryId(bob.getId(), work.getId())).isEmpty();
    }

    @Test
    void findByUserIdAndDueDateBefore_excludesTodayAndFuture() {
        LocalDate today = LocalDate.now();
        newTask(alice, "Overdue", TaskStatus.PENDING, TaskPriority.LOW, today.minusDays(1), null);
        newTask(alice, "Due today", TaskStatus.PENDING, TaskPriority.LOW, today, null);
        newTask(alice, "Future", TaskStatus.PENDING, TaskPriority.LOW, today.plusDays(1), null);
        newTask(alice, "No due date", TaskStatus.PENDING, TaskPriority.LOW, null, null);

        assertThat(taskRepository.findByUserIdAndDueDateBefore(alice.getId(), today))
                .extracting(Task::getTitle).containsExactly("Overdue");
    }

    @Test
    void findByUserIdAndDueDateBefore_isScopedToOwner() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        newTask(bob, "Bob overdue", TaskStatus.PENDING, TaskPriority.LOW, yesterday, null);

        assertThat(taskRepository.findByUserIdAndDueDateBefore(alice.getId(), LocalDate.now())).isEmpty();
    }

    @Test
    void countByUserIdAndStatus_countsOnlyOwnersTasks() {
        newTask(alice, "P1", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(alice, "P2", TaskStatus.PENDING, TaskPriority.LOW, null, null);
        newTask(alice, "C1", TaskStatus.COMPLETED, TaskPriority.LOW, null, null);
        newTask(bob, "Bob pending", TaskStatus.PENDING, TaskPriority.LOW, null, null);

        assertThat(taskRepository.countByUserIdAndStatus(alice.getId(), TaskStatus.PENDING)).isEqualTo(2);
        assertThat(taskRepository.countByUserIdAndStatus(alice.getId(), TaskStatus.COMPLETED)).isEqualTo(1);
        assertThat(taskRepository.countByUserIdAndStatus(alice.getId(), TaskStatus.IN_PROGRESS)).isZero();
    }

    @Test
    void enumsAndDatesSurviveARoundTrip() {
        LocalDate due = LocalDate.now().plusDays(5);
        Long id = newTask(alice, "Round trip", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, due, work).getId();

        taskRepository.flush();
        Task reloaded = taskRepository.findById(id).orElseThrow();

        assertThat(reloaded.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(reloaded.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(reloaded.getDueDate()).isEqualTo(due);
        assertThat(reloaded.getCreatedAt()).isNotNull();
        assertThat(reloaded.getCategory().getName()).isEqualTo("Work");
    }
}
