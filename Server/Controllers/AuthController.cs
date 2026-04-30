using Microsoft.AspNetCore.Mvc;
using SafetyWings.API.Data;
using SafetyWings.API.Models;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SafetyWings.API.Services;
using Microsoft.AspNetCore.Authorization;

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
        public async Task<IActionResult> Register([FromBody] RegisterForm model)
        {
            // 1. Проверка дали заявката изобщо съдържа данни (дали фронтендът не е пратил празен обект)
            if (model == null)
            {
                return BadRequest("Невалидни данни от формата.");
            }

            // 2. Търсим дали потребител с това име вече съществува
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);
            
            // ТУК Е РАЗЛИКАТА: Ако existingUser НЕ е null, значи такъв човек вече има!
            if (existingUser != null)
            {
                // Връщаме 409 Conflict - стандартен код, когато записът вече съществува
                return Conflict(new { message = "Потребител с това потребителско име вече съществува." }); 
            }

            // 3. Хешираме паролата (НИКОГА не пази чист текст!)
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.Password);

            // 4. Създаваме новия обект за базата данни
            var newUser = new User
            {
                Username = model.Username,
                PasswordHash = hashedPassword, // Тук записваме хеша
                FirstName = model.FirstName,
                LastName = model.LastName
            };

            // 5. Запазваме в базата
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Връщаме 200 OK
            return Ok(new { message = "Регистрацията е успешна!" });
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
        public async Task<IActionResult> Login([FromBody] LoginForm model) // ТУК се използва LoginForm!
        {
            if (model == null) return BadRequest("Данните липсват");
            // 1. Търсим потребителя в базата по име
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);

            
                if (user == null) return Unauthorized("Грешно потребителско име или парола.");

                // 2. Проверяваме дали паролата съвпада (ползваме BCrypt!)
                if (!BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
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
                    Expires = DateTime.UtcNow.AddSeconds(10), // Токенът важи 7 дни
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"],  
                    Audience = _configuration["Jwt:Audience"]
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                return Ok(new { Token = tokenString, Message = "Успешен вход!" });

            
        }
        [Authorize]
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            // Ако си тук, значи C# вече е проверил токена и той Е ВАЛИДЕН.
            // .NET автоматично е попълнил данните от токена в обекта User.
            var username = User.Identity.Name;
            return Ok(new { message = $"Здравей, {username}!" });
        }
    }
}