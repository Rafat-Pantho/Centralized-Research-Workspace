package com.crw.backend.service;

import com.crw.backend.dto.workspace.WorkspaceCreateRequest;
import com.crw.backend.dto.workspace.WorkspaceResponse;
import com.crw.backend.entity.User;
import com.crw.backend.entity.Workspace;
import com.crw.backend.exception.ResourceNotFoundException;
import com.crw.backend.repository.UserRepository;
import com.crw.backend.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    @Override
    public WorkspaceResponse createWorkspace(WorkspaceCreateRequest request) {
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(workspaceRepository.save(workspace));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(Long id) {
        return toResponse(findWorkspaceOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getAllWorkspaces() {
        return workspaceRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public WorkspaceResponse addMemberToWorkspace(Long workspaceId, Long userId) {
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        User user = findUserOrThrow(userId);
        workspace.getMembers().add(user);
        return toResponse(workspace);
    }

    @Override
    public WorkspaceResponse removeMemberFromWorkspace(Long workspaceId, Long userId) {
        Workspace workspace = findWorkspaceOrThrow(workspaceId);
        User user = findUserOrThrow(userId);
        workspace.getMembers().remove(user);
        return toResponse(workspace);
    }

    @Override
    public void deleteWorkspace(Long id) {
        if (!workspaceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + id);
        }
        workspaceRepository.deleteById(id);
    }

    private Workspace findWorkspaceOrThrow(Long id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + id));
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private WorkspaceResponse toResponse(Workspace workspace) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .createdAt(workspace.getCreatedAt())
                .memberUsernames(workspace.getMembers().stream()
                        .map(User::getUsername)
                        .toList())
                .build();
    }
}
