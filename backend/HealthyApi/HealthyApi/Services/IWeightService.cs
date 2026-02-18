// <copyright file="IWeightService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Weight;
using HealthyApi.Models.Entities;

public interface IWeightService
{
    Task<IEnumerable<WeightResponseDto>> GetHistoryAsync(string userId);

    Task<WeightResponseDto> AddAsync(string userId, WeightCreateDto dto);

    Task<bool> DeleteAsync(string userId, DateOnly date);
}
