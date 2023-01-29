# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-cli-results.dark.gif
Set Theme "Builtin Tango Dark"

Set FontSize 32
Set Width 1366
Set Height 768
Set PlaybackSpeed 2
Require python
Require touca

Hide
Type "clear"
Enter
Show

Sleep 0.5s
Type "touca results ls"
Sleep 0.5s
Enter
Sleep 1s
Type "touca results compress"
Sleep 0.5s
Enter
Sleep 2s
Type "touca results rm"
Sleep 0.5s
Enter
Sleep 1s
Type "touca results extract"
Sleep 0.5s
Enter
Sleep 2s
Type "touca results merge"
Sleep 0.5s
Enter
Sleep 2s
Type "touca results edit ~/.touca/merged --suite=students-2"
Sleep 0.5s
Enter
Sleep 2s
Type "touca results post ~/.touca/modified"
Sleep 0.5s
Enter
Sleep 2s
Type "touca results --help"
Enter
Sleep 5s
