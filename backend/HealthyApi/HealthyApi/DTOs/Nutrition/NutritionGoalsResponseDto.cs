// <copyright file="NutritionGoalsResponseDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record NutritionGoalsResponseDto(
    string Id,
    int CalorieGoal,
    int StepsGoal,
    DateTime UpdatedAt);
