
using Microsoft.EntityFrameworkCore;
using SafetyWings.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

//namespace SafetyWings.API
//{
//    public class Program
//    {

//        public static void Main(string[] args)
//        {

//            var builder = WebApplication.CreateBuilder(args);
//            var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]); // Взема ключа от appsettings.json

//            // 1. Редакция от външни източници
//            builder.Services.AddCors(options => {
//                options.AddPolicy("AllowAll", policy => {
//                    policy.AllowAnyOrigin()
//                          .AllowAnyMethod()
//                          .AllowAnyHeader();
//                });
//            });

//            //JWT Автентикация
//            builder.Services.AddAuthentication(options =>
//            {
//                options.DefaultAuthenticateScheme = "Bearer";
//                options.DefaultChallengeScheme = "Bearer";
//            })      
//            .AddJwtBearer("Bearer", options =>
//            {
//                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
//                {
//                    ValidateIssuer = true,
//                    ValidateAudience = true,
//                    ValidateLifetime = true,
//                    ValidateIssuerSigningKey = true,
//                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
//                    ValidAudience = builder.Configuration["Jwt:Audience"],
//                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
//                        System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
//                };

//            });
//            builder.Services.AddSwaggerGen(c =>
//            {
//                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "SafetyWings API", Version = "v1" });

//                // 1. Дефинираме как работи защитата (JWT Bearer)
//                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
//                {
//                    Description = "Въведи токена в този формат: Bearer {your_token}",
//                    Name = "Authorization",
//                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
//                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
//                    Scheme = "Bearer"
//                });

//                // 2. Казваме на Swagger да изисква този токен за всички методи
//                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
//                {
//                    {
//                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
//                        {
//                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
//                            {
//                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
//                                Id = "Bearer"
//                            }
//                        },
//                        new string[] {}
//                    }
//                });
//            });
//            // 1. Взимаме Connection String-а от JSON файла
//            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

//            // 2. Свързваме DbContext-а с SQL Сървъра
//            builder.Services.AddDbContext<ApplicationDbContext>(options =>
//                options.UseSqlServer(connectionString));

//            // Port
//            builder.WebHost.ConfigureKestrel(options =>
//            {
//                // Слушай на порт 80 за всяко устройство в мрежата
//                options.ListenAnyIP(80);
//            });

//            // Add services to the container.

//            builder.Services.AddControllers();
//            // Регистрираме услугата за криптиране
//            builder.Services.AddSingleton<SafetyWings.API.Services.EncryptionService>();
//            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
//            builder.Services.AddEndpointsApiExplorer();
//            builder.Services.AddSwaggerGen();

//            var app = builder.Build();
//            app.UseCors("AllowAll");
//            // Configure the HTTP request pipeline.
//            //if (app.Environment.IsDevelopment())
//            //{
//            //    app.UseSwagger();
//            //    app.UseSwaggerUI();
//            //}
//            app.UseSwagger(); // Swagger работи винаги
//            app.UseSwaggerUI(c =>
//            {
//                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Safety Wings API v1");
//                c.RoutePrefix = "swagger"; // Достъп на адрес: http://ip:port/swagger
//            });

//            app.UseHttpsRedirection();

//            app.UseAuthentication();
//            app.UseAuthorization();


//            app.MapControllers();

//            app.Run();
//        }
//    }
//}

namespace SafetyWings.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Взема ключа от appsettings.json. Увери се, че не е null.
            var keyStr = builder.Configuration["Jwt:Key"];
            var key = Encoding.ASCII.GetBytes(keyStr ?? "SecretKeyMustBeLongerThan16Chars_ChangeThisInProd");

            // 1. CORS - Това е супер, остави го така
            builder.Services.AddCors(options => {
                options.AddPolicy("AllowAll", policy => {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });
            // Позволяваме на фронтенда да говори с бекенда
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    policy =>
                    {
                        policy.AllowAnyOrigin() // В училище е най-лесно така, за да не се бориш с портове
                              .AllowAnyMethod()
                              .AllowAnyHeader();
                    });
            });

            // 2. JWT Автентикация
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Bearer";
                options.DefaultChallengeScheme = "Bearer";
            })
            .AddJwtBearer("Bearer", options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };
            });
            
            // Added a test to see if this shit is working
            // 3. Swagger с JWT поддръжка
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "SafetyWings API", Version = "v1" });

                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = "Въведи токена в този формат: Bearer {your_token}",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // 4. База данни
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // 5. Port Configuration
            builder.WebHost.ConfigureKestrel(options =>
            {
                // Слушай на порт 80 за всяко устройство
                options.ListenAnyIP(80);
            });

            builder.Services.AddControllers();

            // Регистриране на EncryptionService
            builder.Services.AddSingleton<SafetyWings.API.Services.EncryptionService>();

            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        //policy.WithOrigins("https://*.ngrok-free.app", "http://127.0.0.1:5500");
                        policy.AllowAnyOrigin();
                        policy.AllowAnyHeader();
                        policy.AllowAnyMethod();
                    });

            });
            // ВНИМАНИЕ: Тук имаше втори AddSwaggerGen(), който изтрих, защото чупеше горния.

            var app = builder.Build();

            // --- MIDDLEWARE PIPELINE ---

            //app.UseHttpsRedirection();
            // CORS трябва да е първи или много високо
            app.UseCors("AlloFrontend");
            app.UseCors("AllowAll");

            // Swagger винаги включен за тестовете
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Safety Wings API v1");
                c.RoutePrefix = "swagger";
            });

            // ВАЖНО: КОМЕНТИРАМЕ ТОВА, ЗА ДА РАБОТИ NGROK НА ПОРТ 80
            if (builder.Configuration["USE_NGROK"] != "true")
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}