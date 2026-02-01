using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SafetyWings.API.Models
{
    public class User
    {
        [JsonIgnore]
        [Key] // Казва на C#, че това е Primary Key (Identity в SQL)
        public int UserID { get; set; }

        [Required]
        public string Username { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        [JsonIgnore]
        public string UserRole { get; set; } = "Pilot"; // По подразбиране
    }
}
