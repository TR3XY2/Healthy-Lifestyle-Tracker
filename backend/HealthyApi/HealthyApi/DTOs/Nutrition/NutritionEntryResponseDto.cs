// <copyright file="NutritionEntryResponseDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record NutritionEntryResponseDto(
    string Id,
    DateTime Date,
    string MealType,
    int Calories,
    decimal Protein,
    decimal Carbs,
    decimal Fats,
    DateTime CreatedAt,
    DateTime UpdatedAt);
