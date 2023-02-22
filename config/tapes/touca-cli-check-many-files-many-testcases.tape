# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-cli-check-many-files-many-testcases.light.gif
Set Theme "Builtin Light"

Set FontSize 32
Set Width 1366
Set Height 768
Require python
Require touca

Hide
Type "clear"
Enter
Sleep 1s
Show

Sleep 0.5s
Type "ls ./out"
Enter
Sleep 1s
Type "touca check --suite=my_db ./out"
Enter
Sleep 4s
