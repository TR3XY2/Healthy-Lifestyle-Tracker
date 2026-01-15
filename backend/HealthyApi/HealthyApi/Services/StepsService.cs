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

    public async Task<StepResponseDto> AddAsync(string userId, StepCreateDto dto)
    {
        var existing = await this.dbContext.StepRecords.FirstOrDefaultAsync(step => step.UserId == userId && step.Date == dto.Date);

        if (existing != null)
        {
            existing.Steps = dto.Steps;
            await this.dbContext.SaveChangesAsync();
            return existing.ToDto();
        }

        var stepRecord = new StepRecord
        {
            UserId = userId,
            Date = dto.Date,
            Steps = dto.Steps,
        };

        await this.dbContext.StepRecords.AddAsync(stepRecord);
        await this.dbContext.SaveChangesAsync();

        return stepRecord.ToDto();
    }

    public async Task<IEnumerable<StepResponseDto>> GetHistoryAsync(
        string userId,
        DateOnly? from,
        DateOnly? to)
        {
            var query = this.dbContext.StepRecords
                .AsNoTracking()
                .Where(r => r.UserId == userId);

            if (from.HasValue)
            {
                query = query.Where(r => r.Date >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(r => r.Date < to.Value);
            }

            return await query
                .OrderBy(r => r.Date)
                .Select(r => r.ToDto())
                .ToListAsync();
        }
}
