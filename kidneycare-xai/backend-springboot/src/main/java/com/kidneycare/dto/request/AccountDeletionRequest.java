package com.kidneycare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AccountDeletionRequest(
        @NotBlank @Size(max = 200) String password,
        @NotBlank @Pattern(regexp = "DELETE") String confirmation) {}
