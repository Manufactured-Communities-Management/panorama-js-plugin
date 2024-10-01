@echo off
cls

docker run --rm -it -v "%cd%":/data generate-panorama test test
IF ERRORLEVEL 1 (
    pause
    exit /b
)

mkdir "%appdata%/npm"
cls

echo.
echo Go to https://d11xh1fqz0z9k8.cloudfront.net/?c=http://localhost:8080 to view the panorama.
npx --yes serve ./ -l 8080 --cors
pause
