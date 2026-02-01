using Microsoft.AspNetCore.Mvc;
using SafetyWings.API.Data;
using SafetyWings.API.Models;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SafetyWings.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public IActionResult Register(User user)
        {
            // 1. Хешираме паролата (Сигурност!)
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            // 2. Добавяме потребителя в списъка
            _context.Users.Add(user);

            // 3. Казваме на DbContext да изпрати промените към SQL
            _context.SaveChanges();

            return Ok("Пилотът е регистриран успешно!");
        }
        
        [HttpDelete("delete")]
        public IActionResult DeleteUser(int id)
        {
            var result = _context.Users.Find(id);
            if (result == null) return NotFound("Потребетелят не беше намерен");
            _context.Users.Remove(result);
            _context.SaveChanges();
            return Ok("Потребителят беше изтрит");
        }
        
         [HttpPost("login")]
        public IActionResult Login([FromBody] User loginDto)
        {
            // 1. Търсим потребителя в базата по име
            var user = _context.Users.FirstOrDefault(u => u.Username == loginDto.Username);
            if (user == null) return Unauthorized("Грешно потребителско име или парола.");

            // 2. Проверяваме дали паролата съвпада (ползваме BCrypt!)
            if (!BCrypt.Net.BCrypt.Verify(loginDto.PasswordHash, user.PasswordHash))
            {
                return Unauthorized("Грешно потребителско име или парола.");
            }

            // 3. Ако всичко е наред, генерираме JWT токен
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("UserId", user.UserID.ToString())
        }),
                Expires = DateTime.UtcNow.AddMinutes(10), // Токенът важи 1 минута
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { Token = tokenString, Message = "Успешен вход!" });
        }
    }
}