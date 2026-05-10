// <copyright file="NutritionController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Controllers;

using HealthyApi.DTOs.Nutrition;
using HealthyApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NutritionController : ControllerBase
{
    private readonly INutritionService service;

    public NutritionController(INutritionService service)
    {
        this.service = service;
    }

    private string UserId => this.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        try
        {
            var product = await this.service.CreateProductAsync(this.UserId, dto);
            return this.CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to create product", error = ex.Message });
        }
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProduct(string id)
    {
        try
        {
            var product = await this.service.GetProductAsync(id);
            if (product == null)
            {
                return this.NotFound();
            }

            return this.Ok(product);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get product", error = ex.Message });
        }
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetUserProducts()
    {
        try
        {
            var products = await this.service.GetUserProductsAsync(this.UserId);
            return this.Ok(products);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get products", error = ex.Message });
        }
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        try
        {
            await this.service.DeleteProductAsync(this.UserId, id);
            return this.NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return this.Forbid();
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to delete product", error = ex.Message });
        }
    }

    [HttpPost("entries")]
    public async Task<IActionResult> LogEntry([FromBody] CreateNutritionEntryDto dto)
    {
        try
        {
            var entry = await this.service.LogEntryAsync(this.UserId, dto);
            return this.CreatedAtAction(nameof(GetEntry), new { id = entry.Id }, entry);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to log entry", error = ex.Message });
        }
    }

    [HttpGet("entries/{id}")]
    public async Task<IActionResult> GetEntry(string id)
    {
        try
        {
            var entries = await this.service.GetEntriesAsync(this.UserId, DateTime.Now, DateTime.Now);
            var entry = entries.FirstOrDefault(e => e.Id == id);
            if (entry == null)
            {
                return this.NotFound();
            }

            return this.Ok(entry);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get entry", error = ex.Message });
        }
    }

    [HttpGet("entries")]
    public async Task<IActionResult> GetEntries([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        try
        {
            var entries = await this.service.GetEntriesAsync(this.UserId, from, to);
            return this.Ok(entries);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get entries", error = ex.Message });
        }
    }

    [HttpDelete("entries/{id}")]
    public async Task<IActionResult> DeleteEntry(string id)
    {
        try
        {
            await this.service.DeleteEntryAsync(this.UserId, id);
            return this.NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return this.Forbid();
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to delete entry", error = ex.Message });
        }
    }

    [HttpGet("goals")]
    public async Task<IActionResult> GetGoals()
    {
        try
        {
            var goals = await this.service.GetGoalsAsync(this.UserId);
            return this.Ok(goals);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get goals", error = ex.Message });
        }
    }

    [HttpPut("goals")]
    public async Task<IActionResult> UpdateGoals([FromBody] UpdateGoalsDto dto)
    {
        try
        {
            var goals = await this.service.UpdateGoalsAsync(this.UserId, dto);
            return this.Ok(goals);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to update goals", error = ex.Message });
        }
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncData([FromBody] SyncRequest request)
    {
        try
        {
            var conflicts = new List<ConflictItem>();
            var syncedProducts = new List<ProductResponseDto>();
            var syncedEntries = new List<NutritionEntryResponseDto>();

            // Process products
            if (request.Products != null)
            {
                foreach (var item in request.Products)
                {
                    try
                    {
                        if (item.Operation == "delete")
                        {
                            await this.service.DeleteProductAsync(this.UserId, item.Id);
                        }
                        else if (item.Operation == "create" || item.Operation == "update")
                        {
                            var product = await this.service.CreateProductAsync(
                                this.UserId,
                                new CreateProductDto(
                                    item.Name,
                                    item.ImageUrl,
                                    item.CaloriesPer100g,
                                    item.ProteinPer100g,
                                    item.CarbsPer100g,
                                    item.FatsPer100g,
                                    item.Source));
                            syncedProducts.Add(product);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error processing product {item.Id}: {ex.Message}");
                    }
                }
            }

            // Process entries
            if (request.Entries != null)
            {
                foreach (var item in request.Entries)
                {
                    try
                    {
                        if (item.Operation == "delete")
                        {
                            await this.service.DeleteEntryAsync(this.UserId, item.Id);
                        }
                        else if (item.Operation == "create" || item.Operation == "update")
                        {
                            var entry = await this.service.LogEntryAsync(
                                this.UserId,
                                new CreateNutritionEntryDto(
                                    item.Date,
                                    item.MealType,
                                    item.Calories,
                                    item.Protein,
                                    item.Carbs,
                                    item.Fats));
                            syncedEntries.Add(entry);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error processing entry {item.Id}: {ex.Message}");
                    }
                }
            }

            var response = new SyncResponse(
                DateTime.UtcNow,
                syncedProducts,
                syncedEntries,
                conflicts);

            return this.Ok(response);
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Sync failed", error = ex.Message });
        }
    }

    [HttpGet("sync/state")]
    public async Task<IActionResult> GetSyncState([FromQuery] DateTime lastSyncTime)
    {
        try
        {
            var products = await this.service.GetUserProductsAsync(this.UserId);
            var entries = await this.service.GetEntriesAsync(
                this.UserId,
                DateTime.UtcNow.AddDays(-30),
                DateTime.UtcNow);

            return this.Ok(new
            {
                timestamp = DateTime.UtcNow,
                products = products,
                entries = entries,
            });
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { message = "Failed to get sync state", error = ex.Message });
        }
    }
}
