// <copyright file="UpdateGoalsDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record UpdateGoalsDto(
    int CalorieGoal,
    int StepsGoal);
