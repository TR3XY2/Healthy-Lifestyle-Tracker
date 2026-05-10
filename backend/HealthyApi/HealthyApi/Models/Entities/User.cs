// <copyright file="User.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities;

using Microsoft.AspNetCore.Identity;

public class User : IdentityUser
{
    public ICollection<StepRecord> StepRecords { get; set; } = new List<StepRecord>();

    public ICollection<WeightRecord> WeightRecords { get; set; } = new List<WeightRecord>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public ICollection<NutritionProduct> NutritionProducts { get; set; } = new List<NutritionProduct>();

    public ICollection<Meal> Meals { get; set; } = new List<Meal>();

    public ICollection<NutritionEntry> NutritionEntries { get; set; } = new List<NutritionEntry>();

    public ICollection<NutritionGoals> NutritionGoals { get; set; } = new List<NutritionGoals>();

    public UserProfile UserProfile { get; set; } = null!;
}
