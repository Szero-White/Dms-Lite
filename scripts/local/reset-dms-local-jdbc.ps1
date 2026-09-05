$ErrorActionPreference = 'Stop'

$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EnvFile = Join-Path $Repo 'run-local.env.bat'
$Launcher = Join-Path $Repo 'run-local.bat'

function Read-BatEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    $pattern = '^\s*set\s+"?' + [regex]::Escape($Name) + '=(.*?)"?\s*$'
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match $pattern) {
            return $Matches[1].TrimEnd('"')
        }
    }

    return $null
}

function Assert-PortFree {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($listener) {
        throw "$ServiceName is still running on port $Port (PID $($listener.OwningProcess)). Close it first."
    }
}

function Find-Java {
    $java = Get-Command java -ErrorAction SilentlyContinue
    if ($java) {
        return $java.Source
    }

    $candidates = @(
        'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot\bin\java.exe',
        'C:\Program Files\Java\jdk-21\bin\java.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw 'java.exe was not found.'
}

function Find-LatestPostgresJar {
    $root = Join-Path $HOME '.m2\repository\org\postgresql\postgresql'
    if (-not (Test-Path $root)) {
        throw "PostgreSQL JDBC Maven directory not found: $root"
    }

    $jars = Get-ChildItem $root -Recurse -File -Filter 'postgresql-*.jar' |
        Where-Object { $_.Name -notmatch 'sources|javadoc' }

    if (-not $jars) {
        throw 'No PostgreSQL JDBC driver jar was found in the Maven cache.'
    }

    return $jars |
        Sort-Object {
            $match = [regex]::Match($_.Name, 'postgresql-([0-9.]+)\.jar')
            if ($match.Success) {
                try { [version]$match.Groups[1].Value } catch { [version]'0.0' }
            }
            else {
                [version]'0.0'
            }
        } -Descending |
        Select-Object -First 1
}

if (-not (Test-Path $Repo)) {
    throw "Repository not found: $Repo"
}
if (-not (Test-Path $EnvFile)) {
    throw "Missing local environment file: $EnvFile"
}
if (-not (Test-Path $Launcher)) {
    throw "Missing launcher: $Launcher"
}

Set-Location $Repo

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ' DMS Lite - JDBC LOCAL DATABASE FACTORY RESET' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'LOCAL ONLY.' -ForegroundColor Yellow
Write-Host 'Application rows will be deleted.' -ForegroundColor Yellow
Write-Host 'Schema and flyway_schema_history will be preserved.' -ForegroundColor Yellow
Write-Host ''

Assert-PortFree -Port 8080 -ServiceName 'Backend'
Assert-PortFree -Port 3000 -ServiceName 'Frontend'

$jdbcUrl = Read-BatEnvValue -Path $EnvFile -Name 'SPRING_DATASOURCE_URL'
$dbUser = Read-BatEnvValue -Path $EnvFile -Name 'SPRING_DATASOURCE_USERNAME'
$dbPassword = Read-BatEnvValue -Path $EnvFile -Name 'SPRING_DATASOURCE_PASSWORD'

if (-not $jdbcUrl) {
    $jdbcUrl = 'jdbc:postgresql://localhost:5432/dms_lite'
}
if (-not $dbUser) {
    $dbUser = 'postgres'
}
if ($null -eq $dbPassword) {
    $dbPassword = ''
}

if ($jdbcUrl -notmatch '^jdbc:postgresql://') {
    throw "This reset script only supports PostgreSQL. Current JDBC URL: $jdbcUrl"
}

$java = Find-Java
$pgJar = Find-LatestPostgresJar

Write-Host "JDBC URL : $jdbcUrl" -ForegroundColor Green
Write-Host "DB user  : $dbUser" -ForegroundColor Green
Write-Host "Java     : $java" -ForegroundColor DarkGray
Write-Host "JDBC jar : $($pgJar.FullName)" -ForegroundColor DarkGray
Write-Host ''

$answer = Read-Host 'Type RESET to delete all LOCAL application data'
if ($answer -cne 'RESET') {
    Write-Host 'Cancelled. Nothing was changed.' -ForegroundColor Yellow
    exit 0
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$snapshotPath = Join-Path $HOME "Downloads\dms-lite-before-reset-rowcounts-$timestamp.csv"
$tempJava = Join-Path $env:TEMP ('DmsLocalReset_' + [guid]::NewGuid().ToString('N') + '.java')

$javaSource = @'
import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

class DmsLocalReset {
    static String quoteIdent(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 4) {
            throw new IllegalArgumentException("Expected: jdbcUrl dbUser dbPassword snapshotPath");
        }

        String url = args[0];
        String user = args[1];
        String password = args[2];
        Path snapshot = Path.of(args[3]);

        Class.forName("org.postgresql.Driver");

        try (Connection connection = DriverManager.getConnection(url, user, password)) {
            connection.setAutoCommit(false);

            try {
                List<String> tables = new ArrayList<>();

                String tableSql = """
                    SELECT c.relname
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public'
                      AND c.relkind IN ('r', 'p')
                      AND c.relname <> 'flyway_schema_history'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM pg_depend d
                          JOIN pg_extension e ON e.oid = d.refobjid
                          WHERE d.objid = c.oid
                            AND d.deptype = 'e'
                      )
                    ORDER BY c.relname
                    """;

                try (Statement st = connection.createStatement();
                     ResultSet rs = st.executeQuery(tableSql)) {
                    while (rs.next()) {
                        tables.add(rs.getString(1));
                    }
                }

                try (BufferedWriter writer = Files.newBufferedWriter(snapshot, StandardCharsets.UTF_8)) {
                    writer.write("table,row_count");
                    writer.newLine();

                    for (String table : tables) {
                        long count;
                        try (Statement st = connection.createStatement();
                             ResultSet rs = st.executeQuery(
                                 "SELECT count(*) FROM public." + quoteIdent(table)
                             )) {
                            rs.next();
                            count = rs.getLong(1);
                        }

                        writer.write("\"" + table.replace("\"", "\"\"") + "\"," + count);
                        writer.newLine();
                    }

                    long flywayRows;
                    try (Statement st = connection.createStatement();
                         ResultSet rs = st.executeQuery(
                             "SELECT count(*) FROM public.flyway_schema_history"
                         )) {
                        rs.next();
                        flywayRows = rs.getLong(1);
                    }

                    writer.write("\"flyway_schema_history (PRESERVED)\"," + flywayRows);
                    writer.newLine();
                }

                if (!tables.isEmpty()) {
                    StringBuilder sql = new StringBuilder("TRUNCATE TABLE ");
                    for (int i = 0; i < tables.size(); i++) {
                        if (i > 0) sql.append(", ");
                        sql.append("public.").append(quoteIdent(tables.get(i)));
                    }
                    sql.append(" RESTART IDENTITY CASCADE");

                    try (Statement st = connection.createStatement()) {
                        st.execute(sql.toString());
                    }
                }

                long flywayRowsAfter;
                try (Statement st = connection.createStatement();
                     ResultSet rs = st.executeQuery(
                         "SELECT count(*) FROM public.flyway_schema_history"
                     )) {
                    rs.next();
                    flywayRowsAfter = rs.getLong(1);
                }

                connection.commit();

                System.out.println("APPLICATION_TABLES_RESET=" + tables.size());
                System.out.println("FLYWAY_HISTORY_ROWS=" + flywayRowsAfter);
                System.out.println("SNAPSHOT=" + snapshot.toAbsolutePath());
            } catch (Exception ex) {
                connection.rollback();
                throw ex;
            }
        }
    }
}
'@

[System.IO.File]::WriteAllText(
    $tempJava,
    $javaSource,
    (New-Object System.Text.UTF8Encoding($false))
)

try {
    Write-Host ''
    Write-Host '[1/3] Resetting application tables with JDBC...' -ForegroundColor Cyan

    & $java `
        --class-path $pgJar.FullName `
        $tempJava `
        $jdbcUrl `
        $dbUser `
        $dbPassword `
        $snapshotPath

    if ($LASTEXITCODE -ne 0) {
        throw "JDBC reset failed with exit code $LASTEXITCODE."
    }

    Write-Host ''
    Write-Host 'Database reset: PASS' -ForegroundColor Green
    Write-Host "Row-count snapshot: $snapshotPath" -ForegroundColor Green

    Write-Host ''
    Write-Host '[2/3] Starting DMS Lite...' -ForegroundColor Cyan

    Start-Process `
        -FilePath 'cmd.exe' `
        -ArgumentList '/c', ('"' + $Launcher + '"') `
        -WorkingDirectory $Repo

    Write-Host ''
    Write-Host '[3/3] Done.' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Factory reset complete.' -ForegroundColor Green
    Write-Host 'Wait for the backend to finish startup and demo seeding.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Frontend: http://localhost:3000' -ForegroundColor Cyan
    Write-Host 'Backend : http://localhost:8080' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Expected seeded accounts use password 123456:' -ForegroundColor DarkGray
    Write-Host '  owner' -ForegroundColor DarkGray
    Write-Host '  sale' -ForegroundColor DarkGray
    Write-Host '  warehouse' -ForegroundColor DarkGray
    Write-Host '  accountant' -ForegroundColor DarkGray
}
finally {
    Remove-Item $tempJava -Force -ErrorAction SilentlyContinue
}
