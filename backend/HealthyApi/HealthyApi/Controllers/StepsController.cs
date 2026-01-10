// <copyright file="StepsController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.Data;
using HealthyApi.DTOs.Steps;
using HealthyApi.Mappings;
using HealthyApi.Models.Entities;
using HealthyApi.Services;
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
    private readonly IStepsService stepsService;
    private readonly UserManager<User> userManager;

    public StepsController(IStepsService stepsService, UserManager<User> userManager)
    {
        this.stepsService = stepsService;
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

        var steps = await this.stepsService.GetHistoryAsync(userId);

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

        var record = await this.stepsService.AddAsync(userId, stepRecordDto);

        return this.Ok(record);
    }
}
