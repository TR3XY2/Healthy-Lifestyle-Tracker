// <copyright file="WeightRecord.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities;

public class WeightRecord
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public User User { get; set; } = null!;

    public DateOnly Date { get; set; }

    public double Weight { get; set; }
}
