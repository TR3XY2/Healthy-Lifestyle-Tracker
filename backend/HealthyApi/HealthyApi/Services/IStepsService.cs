// <copyright file="IStepsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;

public interface IStepsService
{
    Task<IEnumerable<StepRecord>> GetHistoryAsync(string userId);

    Task<StepRecord> AddAsync(string userId, StepCreateDto dto);
}
