package com.crw.backend.service;

import com.crw.backend.dto.task.TaskCreateRequest;
import com.crw.backend.dto.task.TaskResponse;
import com.crw.backend.entity.Task;
import com.crw.backend.entity.TaskStatus;
import com.crw.backend.entity.Workspace;
import com.crw.backend.exception.ResourceNotFoundException;
import com.crw.backend.repository.TaskRepository;
import com.crw.backend.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final WorkspaceRepository workspaceRepository;

    @Override
    public TaskResponse createTask(TaskCreateRequest request) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + request.getWorkspaceId()));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .dueDate(request.getDueDate())
                .workspace(workspace)
                .build();

        return toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        return toResponse(findTaskOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByWorkspace(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        return taskRepository.findByWorkspaceId(workspaceId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TaskResponse updateTaskStatus(Long id, TaskStatus status) {
        Task task = findTaskOrThrow(id);
        task.setStatus(status);
        return toResponse(task);
    }

    @Override
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    private Task findTaskOrThrow(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .workspaceId(task.getWorkspace().getId())
                .workspaceName(task.getWorkspace().getName())
                .build();
    }
}
