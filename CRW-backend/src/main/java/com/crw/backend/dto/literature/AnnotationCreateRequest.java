package com.crw.backend.dto.literature;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnnotationCreateRequest {

    @NotBlank
    private String content;

    @NotNull
    private Long userId;
}
