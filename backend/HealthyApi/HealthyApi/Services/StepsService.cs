// <copyright file="StepsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Data;
using HealthyApi.DTOs.Steps;
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

    public async Task<StepRecord> AddAsync(string userId, StepCreateDto dto)
    {
        var existing = await this.dbContext.StepRecords.FirstOrDefaultAsync(step => step.UserId == userId && step.Date == dto.Date);

        if (existing != null)
        {
            existing.Steps = dto.Steps;
            await this.dbContext.SaveChangesAsync();
            return existing;
        }

        var stepRecord = new StepRecord
        {
            UserId = userId,
            Date = dto.Date,
            Steps = dto.Steps,
        };

        await this.dbContext.StepRecords.AddAsync(stepRecord);
        await this.dbContext.SaveChangesAsync();

        return stepRecord;
    }

    public async Task<IEnumerable<StepRecord>> GetHistoryAsync(string userId)
    {
        return await this.dbContext.StepRecords.Where(record => record.UserId == userId).OrderByDescending(step => step.Date).ToListAsync();
    }
}
