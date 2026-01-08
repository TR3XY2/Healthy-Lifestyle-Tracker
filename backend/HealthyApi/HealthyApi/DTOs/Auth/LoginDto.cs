// <copyright file="LoginDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Auth;

public record LoginDto(
    string email,
    string password);
