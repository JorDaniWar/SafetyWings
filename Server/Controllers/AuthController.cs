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
            // 1. Проверяваме дали такъв потребител вече съществува
            if (model == null)
            {
                // Връщаме 400 или 409, защото заявката е невалидна (потребителят вече е там)
                return BadRequest("Потребителят вече съществува.");
            }
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);

            

            // 2. Хешираме паролата (НИКОГА не пази чист текст!)
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.Password);

            // 3. Създаваме новия обект за базата данни
            var newUser = new User
            {
                Username = model.Username,
                PasswordHash = hashedPassword, // Тук записваме хеша
                FirstName = model.FirstName,
                LastName = model.LastName
            };

            // 4. Запазваме в базата
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

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
            // 1. Търсим потребителя в базата по име
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);

            if (model == null) return BadRequest("Данните липсват");
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
                    Expires = DateTime.UtcNow.AddDays(7), // Токенът важи 1 минута
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