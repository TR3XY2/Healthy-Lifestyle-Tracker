// <copyright file="AuthController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Data;
using HealthyApi.DTOs.Auth;
using HealthyApi.Models.Entities;
using HealthyApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> userManager;
    private readonly IConfiguration configuration;
    private readonly IProfileService profileService;
    private readonly SignInManager<User> signInManager;
    private readonly HealthyDbContext context;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        IProfileService profileService,
        HealthyDbContext context)
    {
        this.userManager = userManager;
        this.signInManager = signInManager;
        this.configuration = configuration;
        this.profileService = profileService;
        this.context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var user = new User
        {
            Email = registerDto.Email,
            UserName = registerDto.Email,
        };

        var result = await this.userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            return this.BadRequest(result.Errors);
        }

        await this.profileService.CreateProfileAsync(user.Id);

        var roleResult = await this.userManager.AddToRoleAsync(user, "User");

        if (!roleResult.Succeeded)
        {
            return this.BadRequest(roleResult.Errors);
        }

        var token = await this.GenerateJwtAsync(user);

        return this.Ok(token);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var user = await this.userManager.FindByEmailAsync(loginDto.Email);

        if (user == null)
        {
            return this.Unauthorized();
        }

        var result = await this.signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

        if (!result.Succeeded)
        {
            return this.Unauthorized();
        }

        var token = await this.GenerateJwtAsync(user);

        return this.Ok(token);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken)
    {
        try
        {
            var storedToken = await this.context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

            if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
            {
                return this.Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            var user = await this.userManager.FindByIdAsync(storedToken.UserId);
            if (user == null)
            {
                return this.Unauthorized();
            }

            var token = await this.GenerateJwtAsync(user);

            storedToken.IsRevoked = true;
            this.context.RefreshTokens.Update(storedToken);

            await this.context.SaveChangesAsync();

            return this.Ok(token);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Token refresh failed", error = ex.Message });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var userId = this.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return this.Unauthorized();
            }

            var tokens = await this.context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }

            this.context.RefreshTokens.UpdateRange(tokens);
            await this.context.SaveChangesAsync();

            return this.Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Logout failed", error = ex.Message });
        }
    }

    private async Task<AuthResponseDto> GenerateJwtAsync(User user)
    {
        var roles = await this.userManager.GetRolesAsync(user);

        var claims = new List<Claim>()
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(this.configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing")));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresIn = 3600; // 1 hour in seconds
        var expires = DateTime.UtcNow.AddSeconds(expiresIn);

        var token = new JwtSecurityToken(
            issuer: this.configuration["Jwt:Issuer"],
            audience: this.configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        // Generate refresh token
        var refreshToken = Guid.NewGuid().ToString();
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        this.context.RefreshTokens.Add(refreshTokenEntity);
        await this.context.SaveChangesAsync();

        return new AuthResponseDto(accessToken, refreshToken, expires, expiresIn);
    }
}
