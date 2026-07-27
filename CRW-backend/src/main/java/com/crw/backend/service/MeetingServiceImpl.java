package com.crw.backend.service;

import com.crw.backend.dto.meeting.MeetingCreateRequest;
import com.crw.backend.dto.meeting.MeetingResponse;
import com.crw.backend.entity.Meeting;
import com.crw.backend.entity.Workspace;
import com.crw.backend.exception.ResourceNotFoundException;
import com.crw.backend.repository.MeetingRepository;
import com.crw.backend.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MeetingServiceImpl implements MeetingService {

    private final MeetingRepository meetingRepository;
    private final WorkspaceRepository workspaceRepository;

    @Override
    public MeetingResponse createMeeting(MeetingCreateRequest request) {
        Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + request.getWorkspaceId()));

        Meeting meeting = Meeting.builder()
                .title(request.getTitle())
                .minutes(request.getMinutes())
                .keyDecisions(request.getKeyDecisions())
                .meetingDate(request.getMeetingDate())
                .workspace(workspace)
                .build();

        return toResponse(meetingRepository.save(meeting));
    }

    @Override
    @Transactional(readOnly = true)
    public MeetingResponse getMeetingById(Long id) {
        return toResponse(findMeetingOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeetingResponse> getMeetingsByWorkspace(Long workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        return meetingRepository.findByWorkspaceId(workspaceId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void deleteMeeting(Long id) {
        if (!meetingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Meeting not found with id: " + id);
        }
        meetingRepository.deleteById(id);
    }

    private Meeting findMeetingOrThrow(Long id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found with id: " + id));
    }

    private MeetingResponse toResponse(Meeting meeting) {
        return MeetingResponse.builder()
                .id(meeting.getId())
                .title(meeting.getTitle())
                .minutes(meeting.getMinutes())
                .keyDecisions(meeting.getKeyDecisions())
                .meetingDate(meeting.getMeetingDate())
                .workspaceId(meeting.getWorkspace().getId())
                .build();
    }
}
