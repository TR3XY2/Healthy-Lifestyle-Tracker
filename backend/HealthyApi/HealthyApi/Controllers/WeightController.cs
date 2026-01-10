// <copyright file="WeightController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Data;
using HealthyApi.DTOs.Steps;
using HealthyApi.Models.Entities;
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
    private readonly HealthyDbContext dbContext;
    private readonly UserManager<User> userManager;

    public WeightController(HealthyDbContext dbContext, UserManager<User> userManager)
    {
        this.dbContext = dbContext;
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

        var weights = await this.dbContext.WeightRecords
            .Where(record => record.UserId == userId)
            .OrderBy(record => record.Date)
            .ToListAsync();

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

        var record = new WeightRecord
        {
            Date = weightCreateDto.Date,
            Weight = weightCreateDto.Weight,
            UserId = userId!,
        };

        await this.dbContext.AddAsync(record);
        await this.dbContext.SaveChangesAsync();

        return this.Ok(record);
    }
}