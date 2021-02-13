@REM
@REM Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
@REM

@ECHO OFF
SETLOCAL ENABLEEXTENSIONS
SET dir_script=%~dp0
SET dir_bin="%dir_script%local\bin"
SET dir_build="%dir_script%local\build"
SET dir_dist="%dir_script%local\dist"
SET dir_export="%dir_build%conan-export-pkg"

FOR %%D IN (%dir_bin%, %dir_build%, %dir_dist%, %dir_export%) DO (
    if exist %%D rmdir %%D /q /s
    mkdir %%D
)

conan install -o shared=True ^
    -o with_tests=True ^
    -o with_utils=True ^
    -o with_examples=True ^
    -o with_framework=True ^
    --install-folder "%dir_build%" ^
    "%dir_script%conanfile.py" --build=missing ^
    || (echo "failed to install dependencies using conan" && exit /b !ERRORLEVEL!)

cmake -B".\local\build" -H"." -G"Visual Studio 16 2019" -A"x64" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_SHARED_LIBS=ON ^
    -DWEASEL_BUILD_TESTS=ON ^
    -DWEASEL_BUILD_UTILS=ON ^
    -DWEASEL_BUILD_EXAMPLES=ON ^
    -DWEASEL_BUILD_FRAMEWORK=ON ^
    || (echo "failed to configure cmake" && exit /b !ERRORLEVEL!)

cmake --build "%dir_build%" --config Release --parallel ^
    || (echo "failed to build the library" && exit /b !ERRORLEVEL!)

cmake --install "%dir_build%" --prefix "%dir_dist%" ^
    || (echo "failed to install build artifacts" && exit /b !ERRORLEVEL!)

conan export-pkg -if %dir_build% -bf "%dir_export%" -f "%dir_script%conanfile.py" ^
    || (echo "failed to create conan package" && exit /b !ERRORLEVEL!)
