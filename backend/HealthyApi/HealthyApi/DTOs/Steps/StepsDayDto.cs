// <copyright file="StepsDayDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Steps;

public record StepsDayDto(
    DateOnly Date,
    int Steps,
    int Calories,
    double? WeightUsed,
    DateOnly? WeightDate);