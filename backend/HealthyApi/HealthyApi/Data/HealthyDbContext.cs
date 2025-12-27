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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<StepRecord>()
                .HasOne(sr => sr.User)
                .WithMany(u => u.StepRecords)
                .HasForeignKey(sr => sr.UserId);

            builder.Entity<WeightRecord>()
                .HasOne(wr => wr.User)
                .WithMany(u => u.WeightRecords)
                .HasForeignKey(wr => wr.UserId);
        }
    }
}
