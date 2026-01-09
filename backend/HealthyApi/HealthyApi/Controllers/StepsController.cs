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

        var steps = await this.dbContext.StepRecords
            .Where(step => step.User.Id == userId)
            .OrderBy(step => step.Date)
            .ToListAsync();

        return this.Ok(steps);
    }

    [HttpPost]
    public async Task<IActionResult> Add(StepCreateDto stepRecordDto)
    {
        var userId = this.userManager.GetUserId(this.User);

        var record = new StepRecord
        {
            UserId = userId!,
            Date = stepRecordDto.date,
            Steps = stepRecordDto.steps,
        };

        this.dbContext.StepRecords.Add(record);
        await this.dbContext.SaveChangesAsync();

        return this.Ok();
    }
}
