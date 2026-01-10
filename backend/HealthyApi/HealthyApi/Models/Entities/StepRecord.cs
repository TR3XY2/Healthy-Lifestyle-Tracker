// <copyright file="StepRecord.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities;

public class StepRecord
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public User User { get; set; } = null!;

    public DateOnly Date { get; set; }

    public int Steps { get; set; }
}
