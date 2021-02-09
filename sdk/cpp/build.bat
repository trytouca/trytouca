SETLOCAL ENABLEEXTENSIONS
SET me=%~n0
SET parent=%~dp0

if exist .\local\bin rmdir .\local\bin /q /s
if exist .\local\build rmdir .\local\build /q /s
if exist .\local\dist rmdir .\local\dist /q /s
if not exist .\local\build\logs mkdir .\local\build\logs

conan install ^
    -o shared=True ^
    -o with_tests=True ^
    -o with_utils=True ^
    -o with_examples=True ^
    -o with_framework=True ^
    --install-folder .\local\build .\conanfile.py --build=missing

cmake -B".\local\build" -H"." -G"Visual Studio 15 2017 Win64" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_SHARED_LIBS=ON ^
    -DWEASEL_BUILD_TESTS=ON ^
    -DWEASEL_BUILD_UTILS=ON ^
    -DWEASEL_BUILD_EXAMPLES=ON ^
    -DWEASEL_BUILD_FRAMEWORK=ON

cmake --build ".\local\build" --config Release --parallel ^
     > .\local\build\logs\weasel.build.stdout ^
     2> .\local\build\logs\weasel.build.stderr

cmake --install ".\local\build" --prefix ".\local\dist"
