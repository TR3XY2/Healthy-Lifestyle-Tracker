// <copyright file="StepResponseDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Steps;

public record StepResponseDto(
    DateOnly Date,
    int Steps);