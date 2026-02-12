// <copyright file="ProfileService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Data;
using HealthyApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

public class ProfileService : IProfileService
{
    private readonly HealthyDbContext context;

    public ProfileService(HealthyDbContext context)
    {
        this.context = context;
    }

    public async Task<UserProfile?> GetProfileAsync(string userId)
    {
        return await this.context.UserProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task UpdateHeightAsync(string userId, int heightCm)
    {
        if (heightCm < 50 || heightCm > 300)
        {
            throw new ArgumentException("Invalid height");
        }

        var profile = await this.context.UserProfiles
            .FirstAsync(p => p.UserId == userId);

        profile.HeightCm = heightCm;

        await this.context.SaveChangesAsync();
    }

    public async Task CreateProfileAsync(string userId)
    {
        var existing = await this.context.UserProfiles
            .AnyAsync(p => p.UserId == userId);

        if (existing)
        {
            return;
        }

        var profile = new UserProfile
        {
            UserId = userId,
        };

        this.context.UserProfiles.Add(profile);
        await this.context.SaveChangesAsync();
    }
}
