// <copyright file="StepsController.cs" company="PlaceholderCompany">
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
[Authorize]
[ApiController]
public class StepsController : ControllerBase
{
    private readonly HealthyDbContext dbContext;
    private readonly UserManager<User> userManager;

    public StepsController(HealthyDbContext dbContext, UserManager<User> userManager)
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

        var steps = await this.dbContext.StepRecords
            .Where(step => step.UserId == userId)
            .OrderBy(step => step.Date)
            .ToListAsync();

        return this.Ok(steps);
    }

    [HttpPost]
    public async Task<IActionResult> Add(StepCreateDto stepRecordDto)
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

        var record = new StepRecord
        {
            UserId = userId!,
            Date = stepRecordDto.Date,
            Steps = stepRecordDto.Steps,
        };

        await this.dbContext.AddAsync(record);
        await this.dbContext.SaveChangesAsync();

        return this.Ok(record);
    }
}
