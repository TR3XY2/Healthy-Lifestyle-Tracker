// <copyright file="CreateProductDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record CreateProductDto(
    string Name,
    string? ImageUrl,
    int CaloriesPer100g,
    decimal ProteinPer100g,
    decimal CarbsPer100g,
    decimal FatsPer100g,
    string Source = "custom");
