using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyWings.API.Data;
using SafetyWings.API.Models;
using SafetyWings.API.Services; // За EncryptionService
using System;
using System.Threading.Tasks;

namespace SafetyWings.API.Controllers
{
    [Authorize] // Само логнати потребители могат да симулират
    [Route("api/[controller]")]
    [ApiController]
    public class SimulationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EncryptionService _encryptionService; // Добавяме криптирането

        // Инжектираме базата и сървиса за криптиране
        public SimulationController(ApplicationDbContext context, EncryptionService encryptionService)
        {
            _context = context;
            _encryptionService = encryptionService;
        }

        [HttpPost("simulate-step")]
        public async Task<IActionResult> SimulateStep()
        {
            // 1. Взимаме ID-то на логнатия пилот от токена
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Невалиден токен.");
            int currentUserId = int.Parse(userIdClaim);

            var rnd = new Random();

            // 2. Генериране на параметрите (числа)
            int heartRate = rnd.Next(1, 10) > 8 ? rnd.Next(121, 140) : rnd.Next(60, 100);
            int oxygen = rnd.Next(1, 10) > 9 ? rnd.Next(85, 89) : rnd.Next(94, 100);
            double temperature = Math.Round(rnd.NextDouble() * (38.5 - 36.1) + 36.1, 1);
            double cortisol = Math.Round(rnd.NextDouble() * (35.0 - 5.0) + 5.0, 2);

            // 3. Оценка през аналитичния модул
            string statusMessage = EvaluateVitals(heartRate, oxygen, temperature, cortisol);
            bool isCritical = statusMessage.Contains("КРИТИЧНО");

            // 4. Създаваме истински обект от тип HealthLog за базата данни
            // Превръщаме числата в стрингове и ГИ КРИПТИРАМЕ!
            var dbLog = new HealthLog
            {
                UserID = currentUserId,
                FlightID = "SIM-" + DateTime.Now.ToString("HHmmss"), // Генерираме фиктивен номер на полет
                HeartRate = _encryptionService.Encrypt(heartRate.ToString()),
                OxygenLevel = _encryptionService.Encrypt(oxygen.ToString()),
                Temperature = _encryptionService.Encrypt(temperature.ToString("F1")),
                StressIndex = _encryptionService.Encrypt(cortisol.ToString("F2")),
                Timestamp = DateTime.Now
            };

            // Записваме в базата
            _context.HealthLogs.Add(dbLog);
            await _context.SaveChangesAsync();

            // 5. За фронтенда връщаме НЕКРИПТИРАНИТЕ числа, за да може JS таблицата да ги нарисува лесно
            var responseData = new
            {
                timestamp = dbLog.Timestamp,
                heartRate = heartRate,
                oxygenSaturation = oxygen,
                temperature = temperature,
                cortisol = cortisol,
                isCritical = isCritical,
                alertNote = statusMessage
            };

            return Ok(new { success = true, data = responseData });
        }

        private string EvaluateVitals(int heartRate, int oxygen, double temperature, double cortisol)
        {
            if (oxygen < 90) return "КРИТИЧНО: Остра хипоксия!";
            if (heartRate > 120) return "КРИТИЧНО: Тахикардия (Екстремен стрес)!";
            if (temperature > 38.0) return "КРИТИЧНО: Висока температура!";
            if (cortisol > 30.0) return "КРИТИЧНО: Паника / Екстремен стрес!";

            if (oxygen >= 90 && oxygen <= 94) return "Внимание: Понижен кислород";
            if (heartRate >= 100 && heartRate <= 120) return "Внимание: Повишен пулс";
            if (temperature >= 37.3 && temperature <= 38.0) return "Внимание: Субфебрилна температура";
            if (cortisol >= 20.0 && cortisol <= 30.0) return "Внимание: Повишени нива на стрес";

            return "Нормално";
        }
    }
}