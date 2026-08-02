package com.momentum.app.repository;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.momentum.app.entity.SubTask;
import com.momentum.app.entity.Task;
import com.momentum.app.entity.User;
import com.momentum.app.enums.TaskPriority;
import com.momentum.app.enums.TaskStatus;

class SubTaskRepositoryTest extends DataJpaTestBase {

    @Autowired
    private SubTaskRepository subTaskRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private UserRepository userRepository;

    private Task taskOne;
    private Task taskTwo;

    private Task newTask(User owner, String title) {
        return taskRepository.save(Task.builder()
                .title(title).status(TaskStatus.PENDING).priority(TaskPriority.MEDIUM)
                .user(owner).build());
    }

    private SubTask newSubTask(Task task, String title, boolean completed) {
        return subTaskRepository.save(SubTask.builder()
                .title(title).completed(completed)
                .completedAt(completed ? LocalDateTime.now() : null)
                .task(task).build());
    }

    @BeforeEach
    void seed() {
        User alice = userRepository.save(User.builder()
                .username("alice").email("alice@example.com").password("hash").build());
        taskOne = newTask(alice, "Task one");
        taskTwo = newTask(alice, "Task two");
    }

    @Test
    void findByTaskId_returnsOnlyThatTasksSubTasks() {
        newSubTask(taskOne, "One A", false);
        newSubTask(taskOne, "One B", true);
        newSubTask(taskTwo, "Two A", false);

        assertThat(subTaskRepository.findByTaskId(taskOne.getId()))
                .extracting(SubTask::getTitle).containsExactlyInAnyOrder("One A", "One B");
    }

    @Test
    void countByTaskId_countsOnlyThatTask() {
        newSubTask(taskOne, "One A", false);
        newSubTask(taskOne, "One B", true);
        newSubTask(taskTwo, "Two A", false);

        assertThat(subTaskRepository.countByTaskId(taskOne.getId())).isEqualTo(2);
        assertThat(subTaskRepository.countByTaskId(taskTwo.getId())).isEqualTo(1);
    }

    @Test
    void countByTaskIdAndCompletedTrue_countsOnlyCompleted() {
        newSubTask(taskOne, "Done A", true);
        newSubTask(taskOne, "Done B", true);
        newSubTask(taskOne, "Open", false);
        newSubTask(taskTwo, "Other done", true);

        assertThat(subTaskRepository.countByTaskIdAndCompletedTrue(taskOne.getId())).isEqualTo(2);
        assertThat(subTaskRepository.countByTaskIdAndCompletedTrue(taskTwo.getId())).isEqualTo(1);
    }

    @Test
    void booleanAndTimestampSurviveARoundTrip() {
        Long id = newSubTask(taskOne, "Completed step", true).getId();

        subTaskRepository.flush();
        SubTask reloaded = subTaskRepository.findById(id).orElseThrow();

        assertThat(reloaded.isCompleted()).isTrue();
        assertThat(reloaded.getCompletedAt()).isNotNull();
        assertThat(reloaded.getTask().getId()).isEqualTo(taskOne.getId());
    }

    @Test
    void countsAreZeroForATaskWithNoSubTasks() {
        assertThat(subTaskRepository.countByTaskId(taskOne.getId())).isZero();
        assertThat(subTaskRepository.countByTaskIdAndCompletedTrue(taskOne.getId())).isZero();
        assertThat(subTaskRepository.findByTaskId(taskOne.getId())).isEmpty();
    }
}
