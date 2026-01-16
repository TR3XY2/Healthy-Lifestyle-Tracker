// <copyright file="IStepsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;

public interface IStepsService
{
    Task<IEnumerable<StepsDayDto>> GetHistoryAsync(
        string userId,
        DateOnly? from,
        DateOnly? to);

    Task<StepsDayDto> AddAsync(string userId, StepCreateDto dto);
}
