// <copyright file="WeightController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Data;
using HealthyApi.DTOs.Weight;
using HealthyApi.Mappings;
using HealthyApi.Models.Entities;
using HealthyApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WeightController : ControllerBase
{
    private readonly IWeightService weightService;
    private readonly UserManager<User> userManager;

    public WeightController(IWeightService weightService, UserManager<User> userManager)
    {
        this.weightService = weightService;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        var userId = this.userManager.GetUserId(this.User);

        if (userId == null)
        {
            return this.Unauthorized();
        }

        var weights = await this.weightService.GetHistoryAsync(userId);

        return this.Ok(weights);
    }

    [HttpPost]
    public async Task<IActionResult> Add(WeightCreateDto weightCreateDto)
    {
        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var userId = this.userManager.GetUserId(this.User);

        if (userId == null)
        {
            return this.Unauthorized();
        }

        var record = await this.weightService.AddAsync(userId, weightCreateDto);

        return this.Ok(record);
    }

    [HttpDelete("{date}")]
    public async Task<IActionResult> Delete(DateOnly date)
    {
        var userId = this.userManager.GetUserId(this.User);

        if (userId == null)
        {
            return this.Unauthorized();
        }

        var result = await this.weightService.DeleteAsync(userId, date);

        if (!result)
        {
            return this.NotFound();
        }

        return this.NoContent();
    }
}