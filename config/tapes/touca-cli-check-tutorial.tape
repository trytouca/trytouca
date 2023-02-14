# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-cli-check-tutorial.dark.gif
Set Theme "Builtin Tango Dark"

Set FontSize 32
Set Width 1366
Set Height 768
Require python
Require touca

Hide
Type "clear"
Enter
Sleep 1s
Type "touca config set api-key=8c3b03a8-0836-4066-b663-f7a44f19fb32"
Enter
Sleep 1s
Type "touca config set api-url=http://localhost:8080/api/@/acme"
Enter
Sleep 1s
Type "touca plugin add plugins://demo"
Enter
Sleep 2s
Type "touca demo download v1.0"
Enter
Sleep 2s
Type "clear"
Enter
Show

Sleep 0.5s
Type "touca check --suite=helmets tutorial/v1.0"
Enter
Sleep 4s
