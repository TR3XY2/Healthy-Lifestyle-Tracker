// <copyright file="WeightMapping.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Mappings;

using System.Runtime.CompilerServices;
using HealthyApi.DTOs.Weight;
using HealthyApi.Models.Entities;

public static class WeightMapping
{
    public static WeightResponseDto ToDto(this WeightRecord weightRecord)
    {
        return new (weightRecord.Date, weightRecord.Weight);
    }
}
