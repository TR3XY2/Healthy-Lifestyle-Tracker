// <copyright file="NutritionService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Data;
using HealthyApi.DTOs.Nutrition;
using HealthyApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

public class NutritionService : INutritionService
{
    private readonly HealthyDbContext context;

    public NutritionService(HealthyDbContext context)
    {
        this.context = context;
    }

    public async Task<ProductResponseDto> CreateProductAsync(string userId, CreateProductDto dto)
    {
        var product = new NutritionProduct
        {
            UserId = userId,
            Name = dto.Name,
            ImageUrl = dto.ImageUrl,
            CaloriesPer100g = dto.CaloriesPer100g,
            ProteinPer100g = dto.ProteinPer100g,
            CarbsPer100g = dto.CarbsPer100g,
            FatsPer100g = dto.FatsPer100g,
            Source = dto.Source,
        };

        this.context.NutritionProducts.Add(product);
        await this.context.SaveChangesAsync();

        return MapToDto(product);
    }

    public async Task<ProductResponseDto?> GetProductAsync(string productId)
    {
        var product = await this.context.NutritionProducts.FindAsync(productId);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<IEnumerable<ProductResponseDto>> GetUserProductsAsync(string userId)
    {
        var products = await this.context.NutritionProducts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return products.Select(MapToDto);
    }

    public async Task DeleteProductAsync(string userId, string productId)
    {
        var product = await this.context.NutritionProducts.FindAsync(productId);

        if (product == null || product.UserId != userId)
        {
            throw new UnauthorizedAccessException("Cannot delete this product");
        }

        this.context.NutritionProducts.Remove(product);
        await this.context.SaveChangesAsync();
    }

    public async Task<NutritionEntryResponseDto> LogEntryAsync(string userId, CreateNutritionEntryDto dto)
    {
        var entry = new NutritionEntry
        {
            UserId = userId,
            Date = dto.Date.Date,
            MealType = dto.MealType,
            Calories = dto.Calories,
            Protein = dto.Protein,
            Carbs = dto.Carbs,
            Fats = dto.Fats,
        };

        this.context.NutritionEntries.Add(entry);
        await this.context.SaveChangesAsync();

        return MapToDto(entry);
    }

    public async Task<IEnumerable<NutritionEntryResponseDto>> GetEntriesAsync(string userId, DateTime from, DateTime to)
    {
        var entries = await this.context.NutritionEntries
            .Where(e => e.UserId == userId && e.Date >= from.Date && e.Date <= to.Date)
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return entries.Select(MapToDto);
    }

    public async Task DeleteEntryAsync(string userId, string entryId)
    {
        var entry = await this.context.NutritionEntries.FindAsync(entryId);

        if (entry == null || entry.UserId != userId)
        {
            throw new UnauthorizedAccessException("Cannot delete this entry");
        }

        this.context.NutritionEntries.Remove(entry);
        await this.context.SaveChangesAsync();
    }

    public async Task<NutritionGoalsResponseDto> GetGoalsAsync(string userId)
    {
        var goals = await this.context.NutritionGoals
            .FirstOrDefaultAsync(g => g.UserId == userId);

        if (goals == null)
        {
            goals = new NutritionGoals
            {
                UserId = userId,
                CalorieGoal = 2200,
                StepsGoal = 8000,
            };

            this.context.NutritionGoals.Add(goals);
            await this.context.SaveChangesAsync();
        }

        return MapToDto(goals);
    }

    public async Task<NutritionGoalsResponseDto> UpdateGoalsAsync(string userId, UpdateGoalsDto dto)
    {
        var goals = await this.context.NutritionGoals
            .FirstOrDefaultAsync(g => g.UserId == userId);

        if (goals == null)
        {
            goals = new NutritionGoals
            {
                UserId = userId,
                CalorieGoal = dto.CalorieGoal,
                StepsGoal = dto.StepsGoal,
            };

            this.context.NutritionGoals.Add(goals);
        }
        else
        {
            goals.CalorieGoal = dto.CalorieGoal;
            goals.StepsGoal = dto.StepsGoal;
            goals.UpdatedAt = DateTime.UtcNow;
            this.context.NutritionGoals.Update(goals);
        }

        await this.context.SaveChangesAsync();

        return MapToDto(goals);
    }

    private static ProductResponseDto MapToDto(NutritionProduct product)
    {
        return new ProductResponseDto(
            product.Id,
            product.Name,
            product.ImageUrl,
            product.CaloriesPer100g,
            product.ProteinPer100g,
            product.CarbsPer100g,
            product.FatsPer100g,
            product.Source,
            product.CreatedAt,
            product.UpdatedAt);
    }

    private static NutritionEntryResponseDto MapToDto(NutritionEntry entry)
    {
        return new NutritionEntryResponseDto(
            entry.Id,
            entry.Date,
            entry.MealType,
            entry.Calories,
            entry.Protein,
            entry.Carbs,
            entry.Fats,
            entry.CreatedAt,
            entry.UpdatedAt);
    }

    private static NutritionGoalsResponseDto MapToDto(NutritionGoals goals)
    {
        return new NutritionGoalsResponseDto(
            goals.Id,
            goals.CalorieGoal,
            goals.StepsGoal,
            goals.UpdatedAt);
    }
}
