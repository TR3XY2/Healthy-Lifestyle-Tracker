// <copyright file="User.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities;

using Microsoft.AspNetCore.Identity;

public class User : IdentityUser
{
    public ICollection<StepRecord> StepRecords { get; set; } = new List<StepRecord>();

    public ICollection<WeightRecord> WeightRecords { get; set; } = new List<WeightRecord>();
}
