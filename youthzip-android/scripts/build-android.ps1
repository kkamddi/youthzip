param(
  [ValidateSet("assembleDebug", "bundleRelease")]
  [string]$Task = "assembleDebug"
)

$candidates = @(@(
  "C:\Program Files\Android\Android Studio\jbr",
  "C:\Program Files\Java\jdk-21",
  $env:JAVA_HOME
) | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ "bin\java.exe")) })

if (-not $candidates) {
  throw "Java 21을 찾지 못했습니다. Android Studio의 JBR 또는 JDK 21을 설치하세요."
}

$env:JAVA_HOME = $candidates[0]
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$androidDir = Resolve-Path (Join-Path $PSScriptRoot "..\android")

Push-Location $androidDir
try {
  & .\gradlew.bat $Task
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
