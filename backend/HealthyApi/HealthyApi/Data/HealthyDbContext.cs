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
        }
    }
}
