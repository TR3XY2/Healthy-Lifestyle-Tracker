// <copyright file="IProfileService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Services;

using HealthyApi.Models.Entities;

public interface IProfileService
{
    Task<UserProfile?> GetProfileAsync(string userId);

    Task UpdateHeightAsync(string userId, int heightCm);

    Task CreateProfileAsync(string userId);
}
