// <copyright file="SyncState.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.DTOs.Nutrition;

public record SyncRequest(
    List<ProductSyncItem>? Products,
    List<EntrySyncItem>? Entries,
    DateTime LastSyncTimestamp);

public record ProductSyncItem(
    string Id,
    string Name,
    string? ImageUrl,
    int CaloriesPer100g,
    decimal ProteinPer100g,
    decimal CarbsPer100g,
    decimal FatsPer100g,
    string Source,
    DateTime UpdatedAt,
    string Operation); // create, update, delete

public record EntrySyncItem(
    string Id,
    DateTime Date,
    string MealType,
    int Calories,
    decimal Protein,
    decimal Carbs,
    decimal Fats,
    DateTime UpdatedAt,
    string Operation); // create, update, delete

public record SyncResponse(
    DateTime ServerTimestamp,
    List<ProductResponseDto>? Products,
    List<NutritionEntryResponseDto>? Entries,
    List<ConflictItem>? Conflicts);

public record ConflictItem(
    string Id,
    string Type, // product, entry
    string Resolution); // server_wins, client_wins
