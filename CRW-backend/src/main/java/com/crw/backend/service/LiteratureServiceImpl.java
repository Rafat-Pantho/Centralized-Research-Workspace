package com.crw.backend.service;

import com.crw.backend.dto.literature.AnnotationCreateRequest;
import com.crw.backend.dto.literature.AnnotationResponse;
import com.crw.backend.dto.literature.LiteratureCreateRequest;
import com.crw.backend.dto.literature.LiteratureResponse;
import com.crw.backend.entity.Annotation;
import com.crw.backend.entity.Literature;
import com.crw.backend.entity.User;
import com.crw.backend.entity.Workspace;
import com.crw.backend.exception.ResourceNotFoundException;
import com.crw.backend.repository.LiteratureRepository;
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
public class LiteratureServiceImpl implements LiteratureService {

    private final LiteratureRepository literatureRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    @Override
    public LiteratureResponse createLiterature(LiteratureCreateRequest request) {
        Workspace workspace = findWorkspaceOrThrow(request.getWorkspaceId());

        Literature literature = Literature.builder()
                .title(request.getTitle())
                .authors(request.getAuthors())
                .publicationYear(request.getPublicationYear())
                .doi(request.getDoi())
                .url(request.getUrl())
                .summary(request.getSummary())
                .workspace(workspace)
                .build();

        return toResponse(literatureRepository.save(literature));
    }

    @Override
    @Transactional(readOnly = true)
    public LiteratureResponse getLiteratureById(Long id) {
        return toResponse(findLiteratureOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiteratureResponse> getLiteratureByWorkspace(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        return literatureRepository.findByWorkspaceId(workspaceId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public LiteratureResponse updateLiterature(Long id, LiteratureCreateRequest request) {
        Literature literature = findLiteratureOrThrow(id);
        literature.setTitle(request.getTitle());
        literature.setAuthors(request.getAuthors());
        literature.setPublicationYear(request.getPublicationYear());
        literature.setDoi(request.getDoi());
        literature.setUrl(request.getUrl());
        literature.setSummary(request.getSummary());
        literature.setWorkspace(findWorkspaceOrThrow(request.getWorkspaceId()));
        return toResponse(literature);
    }

    @Override
    public void deleteLiterature(Long id) {
        if (!literatureRepository.existsById(id)) {
            throw new ResourceNotFoundException("Literature not found with id: " + id);
        }
        literatureRepository.deleteById(id);
    }

    @Override
    public LiteratureResponse addAnnotation(Long literatureId, AnnotationCreateRequest request) {
        Literature literature = findLiteratureOrThrow(literatureId);
        User author = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Annotation annotation = Annotation.builder()
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .literature(literature)
                .author(author)
                .build();

        literature.getAnnotations().add(annotation);
        return toResponse(literature);
    }

    private Literature findLiteratureOrThrow(Long id) {
        return literatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Literature not found with id: " + id));
    }

    private Workspace findWorkspaceOrThrow(Long id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + id));
    }

    private LiteratureResponse toResponse(Literature literature) {
        return LiteratureResponse.builder()
                .id(literature.getId())
                .title(literature.getTitle())
                .authors(literature.getAuthors())
                .publicationYear(literature.getPublicationYear())
                .doi(literature.getDoi())
                .url(literature.getUrl())
                .summary(literature.getSummary())
                .workspaceId(literature.getWorkspace().getId())
                .annotations(literature.getAnnotations().stream()
                        .map(this::toAnnotationResponse)
                        .toList())
                .build();
    }

    private AnnotationResponse toAnnotationResponse(Annotation annotation) {
        return AnnotationResponse.builder()
                .id(annotation.getId())
                .content(annotation.getContent())
                .createdAt(annotation.getCreatedAt())
                .authorUsername(annotation.getAuthor() != null ? annotation.getAuthor().getUsername() : null)
                .build();
    }
}
