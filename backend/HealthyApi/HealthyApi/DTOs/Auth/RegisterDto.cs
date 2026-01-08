// <copyright file="RegisterDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Auth;

public record RegisterDto(
    string email,
    string password);
