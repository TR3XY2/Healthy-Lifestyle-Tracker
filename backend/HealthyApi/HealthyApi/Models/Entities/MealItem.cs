// <copyright file="MealItem.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities;

public class MealItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string MealId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public decimal Grams { get; set; }

    public Meal Meal { get; set; } = null!;

    public NutritionProduct Product { get; set; } = null!;
}
