// <copyright file="AuthResponseDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Auth;

public record AuthResponseDto(
    string Token,
    DateTime ExpiresAt);
