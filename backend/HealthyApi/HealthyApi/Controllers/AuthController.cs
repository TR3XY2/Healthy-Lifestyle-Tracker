// <copyright file="AuthController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Data;
using HealthyApi.DTOs.Auth;
using HealthyApi.Models.Entities;
using HealthyApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration configuration, IProfileService profileService)
    {
        this.userManager = userManager;
        this.signInManager = signInManager;
        this.configuration = configuration;
        this.profileService = profileService;
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

        var expires = DateTime.UtcNow.AddHours(1);

        var token = new JwtSecurityToken(
            issuer: this.configuration["Jwt:Issuer"],
            audience: this.configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new AuthResponseDto(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
