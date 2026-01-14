// <copyright file="IStepsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;

public interface IStepsService
{
    Task<IEnumerable<StepResponseDto>> GetHistoryAsync(
        string userId,
        DateOnly? from,
        DateOnly? to);

    Task<StepResponseDto> AddAsync(string userId, StepCreateDto dto);
}
