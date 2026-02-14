// <copyright file="ProfileController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Models.Entities;
using HealthyApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly IProfileService profileService;
    private readonly UserManager<User> userManager;

    public ProfileController(IProfileService profileService, UserManager<User> userManager)
    {
        this.profileService = profileService;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = this.userManager.GetUserId(this.User);

        if (userId == null)
        {
            return this.Unauthorized();
        }

        var profile = await this.profileService.GetProfileAsync(userId);

        return this.Ok(profile);
    }

    [HttpPut("height")]
    public async Task<IActionResult> UpdateHeight([FromBody] int heightCm)
    {
        var userId = this.userManager.GetUserId(this.User);

        if (userId == null)
        {
            return this.Unauthorized();
        }

        await this.profileService.UpdateHeightAsync(userId, heightCm);

        return this.Ok();
    }
}
