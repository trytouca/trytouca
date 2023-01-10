@REM Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

@ECHO OFF
SETLOCAL ENABLEEXTENSIONS
SET dir_script=%~dp0
SET dir_bin="%dir_script%local\bin"
SET dir_build="%dir_script%local\build"
SET dir_dist="%dir_script%local\dist"
SET dir_export="local\build\conan-export-pkg"

WHERE /q cmake >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo "cmake is required to build this library"
    exit /B !ERRORLEVEL!
)

FOR %%D IN (%dir_bin%, %dir_build%, %dir_dist%, %dir_script%\%dir_export%) DO (
    if exist %%D rmdir %%D /q /s
    mkdir %%D
)

WHERE /q conan >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    conan install -o shared=True ^
        -o with_tests=True ^
        -o with_cli=False ^
        -o with_examples=False ^
        -o with_runner=True ^
        --install-folder "%dir_build%" ^
        "%dir_script%conanfile.py" --build=missing ^
        || (echo "failed to install dependencies using conan" && exit /b !ERRORLEVEL!)
)

cmake -B".\local\build" -H"." -G"Visual Studio 17 2022" -A"x64" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_SHARED_LIBS=ON ^
    -DTOUCA_BUILD_TESTS=ON ^
    -DTOUCA_BUILD_CLI=OFF ^
    -DTOUCA_BUILD_EXAMPLES=OFF ^
    -DTOUCA_BUILD_RUNNER=ON ^
    || (echo "failed to configure cmake" && exit /b !ERRORLEVEL!)

cmake --build "%dir_build%" --config Release --parallel ^
    || (echo "failed to build the library" && exit /b !ERRORLEVEL!)

cmake --install "%dir_build%" --prefix "%dir_dist%" ^
    || (echo "failed to install build artifacts" && exit /b !ERRORLEVEL!)

WHERE /q ctest >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    SET CTEST_OUTPUT_ON_FAILURE=1
    cd "%dir_build%" && ctest . -C Release
)

WHERE /q conan >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    conan export-pkg ^
        -if "%dir_build%" -bf "%dir_script%\%dir_export%" -f "%dir_script%conanfile.py" ^
        || (echo "failed to create conan package" && exit /b !ERRORLEVEL!)
)

EXIT /b 0
