using System.Security.Cryptography;
using System.Text;

namespace SafetyWings.API.Services
{
    public class EncryptionService
    {
        private readonly byte[] _key;
        // Използваме фиксиран IV (Initialization Vector) за този пример. 
        // В реална среда IV трябва да е уникален, но за дипломната работа това е добро начало.
        private readonly byte[] _iv = new byte[16];

        public EncryptionService(IConfiguration configuration)
        {
            // Взимаме ключа, който сложихме в appsettings.json
            var keyString = configuration["EncryptionSettings:Key"];
            _key = Encoding.UTF8.GetBytes(keyString ?? throw new InvalidOperationException("Encryption Key is missing!"));
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            using (Aes aes = Aes.Create())
            {
                aes.Key = _key;
                aes.IV = _iv;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter sw = new StreamWriter(cs))
                        {
                            sw.Write(plainText);
                        }
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            using (Aes aes = Aes.Create())
            {
                aes.Key = _key;
                aes.IV = _iv;

                ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                using (MemoryStream ms = new MemoryStream(Convert.FromBase64String(cipherText)))
                {
                    using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader sr = new StreamReader(cs))
                        {
                            return sr.ReadToEnd();
                        }
                    }
                }
            }
        }
    }
}
