// <copyright file="UserProfile.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace HealthyApi.Models.Entities
{
    public class UserProfile
    {
        public int Id { get; set; }

        public string UserId { get; set; } = null!;

        public User User { get; set; } = null!;

        public int? HeightCm { get; set; }
    }
}