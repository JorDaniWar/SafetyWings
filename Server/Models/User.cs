using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SafetyWings.API.Models
{
    public class User
    {
        [Key] // Казва на C#, че това е Primary Key (Identity в SQL)
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserID { get; set; }

        [Required]
        public string Username { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public string UserRole { get; set; } = "Pilot"; // По подразбиране
    }
}
