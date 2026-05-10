// <copyright file="CreateNutritionEntryDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record CreateNutritionEntryDto(
    DateTime Date,
    string MealType,
    int Calories,
    decimal Protein,
    decimal Carbs,
    decimal Fats);
