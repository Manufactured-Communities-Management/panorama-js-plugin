@echo off


set repoRootDir=C:\path\to\your\repo\directory


set initialDir=%cd%
cd /d "%repoRootDir%"
IF ERRORLEVEL 1 (
    echo Failed to open the given repo-root-dir directory. Please check if you inputted the correct path.
    pause
    exit /b
)
git fetch --all
git reset --hard origin/master
IF ERRORLEVEL 1 (
    echo Failed to pull the latest version. Please check if the given repo-root-dir directory is the root of the git repo.
    pause
    exit /b
)
timeout /t 5 /nobreak

cd /d "./scripts/postprocessor"
docker rmi generate-panorama
docker rmi generate-panorama
docker rmi generate-panorama
docker build -t generate-panorama .
timeout /t 5 /nobreak

cd /d "%initialDir%"


docker run --rm -it -v %cd%:/data generate-panorama sso sso
pause
