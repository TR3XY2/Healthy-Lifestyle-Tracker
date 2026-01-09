// <copyright file="StepCreateDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Steps;

public record StepCreateDto(
    DateTime date,
    int steps);
