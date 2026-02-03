using Microsoft.EntityFrameworkCore;
using SafetyWings.API.Models; // Увери се, че това име съвпада с твоя проект

namespace SafetyWings.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<HealthLog> HealthLogs { get; set; }
    }
}
