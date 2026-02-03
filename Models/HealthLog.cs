using System.ComponentModel.DataAnnotations;

namespace SafetyWings.API.Models;
public class HealthLog
{
    [Key]
    public int LogID { get; set; }

    [Required]
    public int UserID { get; set; }

    public string FlightID { get; set; } = string.Empty; // Добави това тук

    public string HeartRate { get; set; } = string.Empty;
    public string OxygenLevel { get; set; } = string.Empty;
    public string Temperature { get; set; } = string.Empty;
    public string StressIndex { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.Now;
}