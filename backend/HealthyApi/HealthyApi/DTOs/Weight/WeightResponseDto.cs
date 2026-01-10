// <copyright file="WeightResponseDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Weight;

public record WeightResponseDto(
    DateOnly Date,
    double Weight);
