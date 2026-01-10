// <copyright file="WeightService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Data;
using HealthyApi.DTOs.Weight;
using HealthyApi.Mappings;
using HealthyApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

public class WeightService : IWeightService
{
    private readonly HealthyDbContext dbContext;

    public WeightService(HealthyDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<WeightResponseDto> AddAsync(string userId, WeightCreateDto dto)
    {
        var existing = await this.dbContext.WeightRecords.FirstOrDefaultAsync(x => x.UserId == userId && x.Date == dto.Date);

        if (existing != null)
        {
            existing.Weight = dto.Weight;
            await this.dbContext.SaveChangesAsync();
            return existing.ToDto();
        }

        var weightRecord = new WeightRecord
        {
            UserId = userId,
            Date = dto.Date,
            Weight = dto.Weight,
        };

        await this.dbContext.WeightRecords.AddAsync(weightRecord);
        await this.dbContext.SaveChangesAsync();

        return weightRecord.ToDto();
    }

    public async Task<IEnumerable<WeightResponseDto>> GetHistoryAsync(string userId)
    {
        return await this.dbContext.WeightRecords
            .AsNoTracking()
            .Where(weight => weight.UserId == userId)
            .OrderByDescending(weight => weight.Date)
            .Select(weight => weight.ToDto())
            .ToListAsync();
    }
}
