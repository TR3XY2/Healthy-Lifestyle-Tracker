// <copyright file="IWeightService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;

public interface IWeightService
{
    Task<IEnumerable<WeightRecord>> GetHistoryAsync(string userId);

    Task<WeightRecord> AddAsync(string userId, WeightCreateDto dto);
}
