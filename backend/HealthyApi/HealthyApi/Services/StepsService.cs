// <copyright file="StepsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Data;
using HealthyApi.DTOs.Steps;
using HealthyApi.Mappings;
using HealthyApi.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public class StepsService : IStepsService
{
    private readonly HealthyDbContext dbContext;

    public StepsService(HealthyDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<StepsDayDto> AddAsync(string userId, StepCreateDto dto)
    {
        var record = await this.dbContext.StepRecords
        .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == dto.Date);

        if (record == null)
        {
            record = new StepRecord
            {
                UserId = userId,
                Date = dto.Date,
                Steps = dto.Steps,
            };
            this.dbContext.StepRecords.Add(record);
        }
        else
        {
            record.Steps = dto.Steps;
        }

        await this.dbContext.SaveChangesAsync();

        var weight = await this.dbContext.WeightRecords
            .Where(w => w.UserId == userId)
            .OrderBy(w => Math.Abs(
                (w.Date.ToDateTime(TimeOnly.MinValue) -
                 dto.Date.ToDateTime(TimeOnly.MinValue)).TotalDays))
            .FirstOrDefaultAsync();

        return new StepsDayDto(
            record.Date,
            record.Steps,
            CalculateCalories(record.Steps, weight?.Weight),
            weight?.Weight,
            weight?.Date);
    }

    public async Task<IEnumerable<StepsDayDto>> GetHistoryAsync(
        string userId,
        DateOnly? from,
        DateOnly? to)
    {
        var steps = await this.dbContext.StepRecords
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .Where(s => !from.HasValue || s.Date >= from.Value)
            .Where(s => !to.HasValue || s.Date < to.Value)
            .OrderBy(s => s.Date)
            .ToListAsync();

        var weights = await this.dbContext.WeightRecords
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Date)
            .ToListAsync();

        return steps.Select(step =>
        {
            var weight = FindClosestWeight(step.Date, weights);

            return new StepsDayDto(
                Date: step.Date,
                Steps: step.Steps,
                Calories: CalculateCalories(step.Steps, weight?.Weight),
                WeightUsed: weight?.Weight,
                WeightDate: weight?.Date);
        });
    }

    private static WeightRecord? FindClosestWeight(DateOnly date, List<WeightRecord> weights)
    {
        if (weights.Count == 0)
        {
            return null;
        }

        return weights
            .OrderBy(w => Math.Abs(
                (w.Date.ToDateTime(TimeOnly.MinValue) -
                 date.ToDateTime(TimeOnly.MinValue)).TotalDays))
            .First();
    }

    private static int CalculateCalories(int steps, double? weight)
    {
        if (weight == null)
        {
            return (int)(steps * 0.04);
        }

        return (int)(steps * weight.Value * 0.0005);
    }
}
