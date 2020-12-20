@echo off
python --version >nul 2>nul
if %ERRORLEVEL% == 0 goto continue
echo Python not found. Please install Python 3.6 and add it to your path.
exit /b 1
:continue

if not exist env\Scripts\activate (
    python -m venv env
)

env\Scripts\activate
env\Scripts\pip install -r requirements.txt
