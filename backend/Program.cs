using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS so the frontend works from any local origin (file://, Live Server, localhost)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Serve frontend files (index.html, style.css, script.js) from the project directory
var projectDirectory = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, ".."));
if (Directory.Exists(projectDirectory))
{
    var fileProvider = new PhysicalFileProvider(projectDirectory);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = fileProvider,
        DefaultFileNames = new List<string> { "index.html" }
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider
    });
}

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=UserAuthDB;Trusted_Connection=True;TrustServerCertificate=True;";

// ========================================================
// HEALTH CHECK ENDPOINT
// ========================================================
app.MapGet("/api/health", async () =>
{
    try
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        using var cmd = new SqlCommand("SELECT @@SERVERNAME, DB_NAME(), COUNT(1) FROM Users", connection);
        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            var server = reader.GetString(0);
            var db = reader.GetString(1);
            var count = reader.GetInt32(2);
            return Results.Ok(new
            {
                status = "Connected",
                server = server,
                database = db,
                registeredUsersCount = count
            });
        }
        return Results.Ok(new { status = "Connected" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database connection failed: {ex.Message}");
    }
});

// ========================================================
// REGISTRATION ENDPOINT (POST /api/auth/register)
// ========================================================
app.MapPost("/api/auth/register", async (RegisterRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Username))
        return Results.BadRequest(new { message = "Username or email is required." });

    if (request.Username.Trim().Length < 3)
        return Results.BadRequest(new { message = "Username must be at least 3 characters." });

    if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        return Results.BadRequest(new { message = "Password must be at least 6 characters." });

    if (request.Password != request.ConfirmPassword)
        return Results.BadRequest(new { message = "Passwords do not match." });

    var username = request.Username.Trim();
    var role = string.IsNullOrWhiteSpace(request.Role) ? "user" : request.Role.Trim();

    try
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        // 1. Check if user already exists in SQL Server
        const string checkSql = "SELECT COUNT(1) FROM Users WHERE Username = @Username";
        using (var checkCmd = new SqlCommand(checkSql, connection))
        {
            checkCmd.Parameters.AddWithValue("@Username", username);
            var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
            if (count > 0)
            {
                return Results.BadRequest(new { message = "This username or email is already registered." });
            }
        }

        // 2. Hash password with PBKDF2 + cryptographically secure salt
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(request.Password),
            salt,
            iterations: 100_000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 32
        );

        var saltBase64 = Convert.ToBase64String(salt);
        var hashBase64 = Convert.ToBase64String(hash);

        // 3. Insert new user into SQL Server
        const string insertSql = @"
            INSERT INTO Users (Username, PasswordHash, PasswordSalt, Role, CreatedAt)
            VALUES (@Username, @PasswordHash, @PasswordSalt, @Role, GETDATE());";

        using (var insertCmd = new SqlCommand(insertSql, connection))
        {
            insertCmd.Parameters.AddWithValue("@Username", username);
            insertCmd.Parameters.AddWithValue("@PasswordHash", hashBase64);
            insertCmd.Parameters.AddWithValue("@PasswordSalt", saltBase64);
            insertCmd.Parameters.AddWithValue("@Role", role);

            await insertCmd.ExecuteNonQueryAsync();
        }

        return Results.Ok(new
        {
            message = "Registration successful! Welcome aboard.",
            username = username
        });
    }
    catch (SqlException ex)
    {
        return Results.Problem($"SQL Server error: {ex.Message}");
    }
    catch (Exception ex)
    {
        return Results.Problem($"An unexpected error occurred: {ex.Message}");
    }
});

// ========================================================
// LOGIN ENDPOINT (POST /api/auth/login)
// ========================================================
app.MapPost("/api/auth/login", async (LoginRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { message = "Username and password are required." });

    var username = request.Username.Trim();

    try
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        const string selectSql = @"
            SELECT Id, Username, PasswordHash, PasswordSalt, Role 
            FROM Users 
            WHERE Username = @Username;";

        using var cmd = new SqlCommand(selectSql, connection);
        cmd.Parameters.AddWithValue("@Username", username);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return Results.BadRequest(new { message = "Invalid username or password." });
        }

        var storedHashBase64 = reader.GetString(2);
        var storedSaltBase64 = reader.GetString(3);
        var role = reader.GetString(4);

        var salt = Convert.FromBase64String(storedSaltBase64);
        var expectedHash = Convert.FromBase64String(storedHashBase64);

        // Verify entered password against stored salt and hash
        var computedHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(request.Password),
            salt,
            iterations: 100_000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 32
        );

        if (!CryptographicOperations.FixedTimeEquals(computedHash, expectedHash))
        {
            return Results.BadRequest(new { message = "Invalid username or password." });
        }

        return Results.Ok(new
        {
            message = "Login successful! Welcome back.",
            username = username,
            role = role
        });
    }
    catch (SqlException ex)
    {
        return Results.Problem($"SQL Server error: {ex.Message}");
    }
    catch (Exception ex)
    {
        return Results.Problem($"An unexpected error occurred: {ex.Message}");
    }
});

// ========================================================
// ADMIN USERS LIST ENDPOINT (GET /api/admin/users)
// ========================================================
app.MapGet("/api/admin/users", async () =>
{
    try
    {
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        const string sql = "SELECT Id, Username, Role, CreatedAt FROM Users ORDER BY Id DESC";
        using var cmd = new SqlCommand(sql, connection);
        using var reader = await cmd.ExecuteReaderAsync();

        var users = new List<object>();
        while (await reader.ReadAsync())
        {
            users.Add(new
            {
                id = reader.GetInt32(0),
                username = reader.GetString(1),
                role = reader.GetString(2),
                createdAt = reader.GetDateTime(3)
            });
        }

        return Results.Ok(users);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Could not retrieve users: {ex.Message}");
    }
});

app.Run();

// Request DTOs
public record RegisterRequest(string? Username, string? Password, string? ConfirmPassword, string? Role);
public record LoginRequest(string? Username, string? Password, bool RememberMe);
