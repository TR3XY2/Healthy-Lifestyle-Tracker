// <copyright file="WeightCreateDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Weight;

public record WeightCreateDto(
    DateOnly Date,
    double Weight);
