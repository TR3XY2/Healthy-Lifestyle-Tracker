// <copyright file="INutritionService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.DTOs.Nutrition;
using HealthyApi.Models.Entities;

public interface INutritionService
{
    // Products
    Task<ProductResponseDto> CreateProductAsync(string userId, CreateProductDto dto);

    Task<ProductResponseDto?> GetProductAsync(string productId);

    Task<IEnumerable<ProductResponseDto>> GetUserProductsAsync(string userId);

    Task DeleteProductAsync(string userId, string productId);

    // Entries
    Task<NutritionEntryResponseDto> LogEntryAsync(string userId, CreateNutritionEntryDto dto);

    Task<IEnumerable<NutritionEntryResponseDto>> GetEntriesAsync(string userId, DateTime from, DateTime to);

    Task DeleteEntryAsync(string userId, string entryId);

    // Goals
    Task<NutritionGoalsResponseDto> GetGoalsAsync(string userId);

    Task<NutritionGoalsResponseDto> UpdateGoalsAsync(string userId, UpdateGoalsDto dto);
}
