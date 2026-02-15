using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using SafetyWings.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;

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

            // 1. JWT Key Setup
            var keyStr = builder.Configuration["Jwt:Key"] ?? "SecretKeyMustBeLongerThan16Chars_ChangeThisInProd";
            var key = Encoding.ASCII.GetBytes(keyStr);

            // 2. CORS - Една политика за всичко (най-лесно за разработка)
            builder.Services.AddCors(options => {
                options.AddPolicy("AllowAll", policy => {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            // 3. Authentication & JWT
            builder.Services.AddAuthentication(options => {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options => {
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

            // 4. Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c => {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "SafetyWings API", Version = "v1" });
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = "Bearer {token}",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });
                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
                }, new string[] {}
            }
        });
            });

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddControllers();
            builder.Services.AddSingleton<SafetyWings.API.Services.EncryptionService>();

            // ПРЕМАХВАМЕ РЪЧНИЯ ListenAnyIP(7000), за да оставим launchSettings.json да командва парада!

            


            var app = builder.Build();

            // --- MIDDLEWARE ---
            app.UseCors("AllowAll"); // Сега името съвпада точно
            if (app.Environment.IsEnvironment("Ngrok"))
            {
                // Tell .NET to accept the ngrok proxy headers
                app.UseForwardedHeaders(new ForwardedHeadersOptions
                {
                    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
                });
            }
            else
            {
                // Only force HTTPS if we are NOT using ngrok. 
                // (ngrok hates local HTTPS redirection)
                app.UseHttpsRedirection();
            }

            if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Ngrok"))
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // 1. Намираме точния път до папката Client (тя е едно ниво назад от Server)
            var clientFolderPath = Path.Combine(builder.Environment.ContentRootPath, "..", "Client");

            // 2. Казваме на .NET да зарежда index.html по подразбиране
            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = new PhysicalFileProvider(Path.GetFullPath(clientFolderPath))
            });

            // 3. Казваме на .NET да сервира всички статични файлове (CSS, JS, Изображения) от Client папката
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.GetFullPath(clientFolderPath))
            });

            // Интелигентно пренасочване към HTTPS (само ако не сме в NGrok)
            // Ако сме в NGrok режим, слушаме на порт 80


            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}