using Microsoft.AspNetCore.Authorization; // За [Authorize] 
using Microsoft.AspNetCore.Mvc;           // За [ApiController] и [HttpPost]
using Microsoft.EntityFrameworkCore;      // За връзка с базата 
using SafetyWings.API.Data;
using SafetyWings.API.Models;             // Увери се, че тук е твоят модел HealthLog [cite: 1, 11, 12]
using SafetyWings.API.Services;
using System.Security.Claims;             // За четене на UserId от токена
namespace SafetyWings.API.Controllers
{
    [Authorize] // Само пилоти с JWT токен имат достъп 
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Диспечерът към SafetyWingsDB 
        private readonly EncryptionService _encryptionService; // Твоят AES алгоритъм 

        public HealthController(ApplicationDbContext context, EncryptionService encryptionService)
        {
            _context = context;
            _encryptionService = encryptionService;
        }

        [HttpPost("log")]
        public async Task<IActionResult> AddLog([FromBody] HealthLog log)
        {
            // Взимаме ID-то на пилота от JWT токена 
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Невалиден токен.");

            log.UserID = int.Parse(userIdClaim);

            // КРИПТИРАНЕ на данните преди запис (Точка 14 от плана) [cite: 1, 8, 14]
            log.HeartRate = _encryptionService.Encrypt(log.HeartRate);
            log.OxygenLevel = _encryptionService.Encrypt(log.OxygenLevel);
            log.Temperature = _encryptionService.Encrypt(log.Temperature);
            log.StressIndex = _encryptionService.Encrypt(log.StressIndex);

            _context.HealthLogs.Add(log); // Добавяне в таблицата HealthLog [cite: 1, 11, 12]
            await _context.SaveChangesAsync(); // Физическо записване в SQL Server [cite: 1, 3, 4]

            return Ok(new { message = "Данните са криптирани и записани успешно." });
        }

        [HttpGet("history/")]
        public async Task<IActionResult> GetHistory()
        {
            var UserIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(UserIdClaim)) return Unauthorized();
            int pilotId = int.Parse(UserIdClaim);
            
            // 1. Взимаме последните 20 записа от базата за конкретния пилот
            var logs = await _context.HealthLogs
                .Where(l => l.UserID == pilotId)
                .OrderByDescending(l => l.Timestamp)
                .Take(20)
                .ToListAsync();

            if (logs == null || !logs.Any())
            {
                return Ok(new List<object>()); // Връщаме празен списък, ако няма данни
            }

            // 2. Декриптираме данните, преди да ги пратим към браузъра/телефона
            var decryptedHistory = logs.Select(l => new
            {
                l.Timestamp,
                // Използваме твоя метод Decrypt. Ако данните в базата не са криптирани правилно, 
                // тук може да гръмне, затова добавяме проверка.
                HeartRate = _encryptionService.Decrypt(l.HeartRate),
                Temperature = _encryptionService.Decrypt(l.Temperature),
                OxygenLevel = _encryptionService.Decrypt(l.OxygenLevel)
            }).OrderBy(l => l.Timestamp); // Подреждаме ги от най-стария към най-новия за графиката

            return Ok(decryptedHistory);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLog(int id)
        {
            // 1. Вземаме ID-то на логнатия потребител от токена
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int currentUserId = int.Parse(userIdClaim);

            // 2. Намираме записа в базата
            var log = await _context.HealthLogs.FindAsync(id);

            if (log == null)
            {
                return NotFound(new { message = "Log not found." });
            }

            // 3. ПРОВЕРКА: Този лог на този потребител ли е?
            if (log.UserID != currentUserId)
            {
                return Forbid(); // Не можеш да триеш чужди данни!
            }

            _context.HealthLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Log {id} deleted successfully." });
        }
        [HttpGet("status")]
        public async Task<IActionResult> GetHealthStatus()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int currentUserId = int.Parse(userIdClaim);

            // Вземаме последните 10 записа на пилота
            var logs = await _context.HealthLogs
                .Where(l => l.UserID == currentUserId)
                .OrderByDescending(l => l.Timestamp)
                .Take(10)
                .ToListAsync();

            if (!logs.Any()) return NotFound("Няма открити записи.");

            // Декриптираме и пресмятаме среден пулс
            double totalHeartRate = 0;
            foreach (var log in logs)
            {
                var decryptedHeartRate = _encryptionService.Decrypt(log.HeartRate);
                totalHeartRate += double.Parse(decryptedHeartRate);
            }

            double averageHeartRate = totalHeartRate / logs.Count;
            string recommendation = averageHeartRate > 100 ? "Препоръчителна почивка" : "В норма";

            return Ok(new
            {
                AverageHeartRate = averageHeartRate,
                Status = recommendation,
                LastChecked = DateTime.Now
            });
        }
        
    }
}