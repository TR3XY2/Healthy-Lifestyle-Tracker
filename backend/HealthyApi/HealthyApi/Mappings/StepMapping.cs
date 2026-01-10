// <copyright file="StepMapping.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Mappings;

using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;

public static class StepMapping
{
    public static StepResponseDto ToDto(this StepRecord entity)
    {
        return new (entity.Date, entity.Steps);
    }
}