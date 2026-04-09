using AirAware.Models;
using Microsoft.EntityFrameworkCore;

namespace AirAware.Data;

public class AirAwareDbContext(DbContextOptions<AirAwareDbContext> options) : DbContext(options)
{
    public DbSet<SensorReading> SensorReadings => Set<SensorReading>();
    public DbSet<AlertThreshold> AlertThresholds => Set<AlertThreshold>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // SensorType-Enum als smallint speichern (passend zu pgAdmin-Spalte)
        modelBuilder.Entity<SensorReading>()
            .Property(r => r.Type)
            .HasConversion<short>();

        modelBuilder.Entity<AlertThreshold>()
            .Property(t => t.Type)
            .HasConversion<short>();

        // Unique-Constraint auf metric_name (wie in pgAdmin angelegt)
        modelBuilder.Entity<AlertThreshold>()
            .HasIndex(t => t.MetricName)
            .IsUnique();

        // Nur ein Threshold pro SensorType erlaubt
        modelBuilder.Entity<AlertThreshold>()
            .HasIndex(t => t.Type)
            .IsUnique();

        // Username muss eindeutig sein
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
    }
}
