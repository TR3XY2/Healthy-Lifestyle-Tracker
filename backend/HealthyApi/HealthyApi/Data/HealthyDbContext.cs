// <copyright file="HealthyDbContext.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Data
{
    using HealthyApi.Models.Entities;
    using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore;

    public class HealthyDbContext : IdentityDbContext<User>
    {
        public HealthyDbContext(DbContextOptions<HealthyDbContext> options)
            : base(options)
        {
        }

        public DbSet<StepRecord> StepRecords { get; set; }

        public DbSet<WeightRecord> WeightRecords { get; set; }

        public DbSet<UserProfile> UserProfiles { get; set; }

        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<NutritionProduct> NutritionProducts { get; set; }

        public DbSet<Meal> Meals { get; set; }

        public DbSet<MealItem> MealItems { get; set; }

        public DbSet<NutritionEntry> NutritionEntries { get; set; }

        public DbSet<NutritionGoals> NutritionGoals { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<StepRecord>()
                .Property(x => x.Date)
                .HasColumnType("date");

            builder.Entity<StepRecord>()
                .HasIndex(x => new { x.UserId, x.Date })
                .IsUnique();

            builder.Entity<StepRecord>()
                .HasOne(sr => sr.User)
                .WithMany(u => u.StepRecords)
                .HasForeignKey(sr => sr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<WeightRecord>()
                .HasIndex(x => new { x.UserId, x.Date })
                .IsUnique();

            builder.Entity<WeightRecord>()
                .Property(x => x.Date)
                .HasColumnType("date");

            builder.Entity<WeightRecord>()
                .HasOne(wr => wr.User)
                .WithMany(u => u.WeightRecords)
                .HasForeignKey(wr => wr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<User>()
                .HasOne(u => u.UserProfile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RefreshToken
            builder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique();

            // NutritionProduct
            builder.Entity<NutritionProduct>()
                .HasOne(np => np.User)
                .WithMany(u => u.NutritionProducts)
                .HasForeignKey(np => np.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<NutritionProduct>()
                .HasIndex(np => new { np.UserId, np.Name });

            // Meal
            builder.Entity<Meal>()
                .HasOne(m => m.User)
                .WithMany(u => u.Meals)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // MealItem
            builder.Entity<MealItem>()
                .HasOne(mi => mi.Meal)
                .WithMany(m => m.Items)
                .HasForeignKey(mi => mi.MealId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MealItem>()
                .HasOne(mi => mi.Product)
                .WithMany(p => p.MealItems)
                .HasForeignKey(mi => mi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // NutritionEntry
            builder.Entity<NutritionEntry>()
                .HasOne(ne => ne.User)
                .WithMany(u => u.NutritionEntries)
                .HasForeignKey(ne => ne.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<NutritionEntry>()
                .Property(x => x.Date)
                .HasColumnType("date");

            builder.Entity<NutritionEntry>()
                .HasIndex(x => new { x.UserId, x.Date })
                .IsUnique(false);

            // NutritionGoals
            builder.Entity<NutritionGoals>()
                .HasOne(ng => ng.User)
                .WithMany(u => u.NutritionGoals)
                .HasForeignKey(ng => ng.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<NutritionGoals>()
                .HasIndex(ng => ng.UserId)
                .IsUnique();
        }
    }
}
