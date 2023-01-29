# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-cli-server.dark.gif
Set Theme "Builtin Tango Dark"

Set FontSize 32
Set Width 1366
Set Height 768
Set PlaybackSpeed 2
Require python
Require touca
Require docker

Hide
Type "clear"
Enter
Show

Sleep 0.5s
Type "touca server install"
Sleep 2s
Enter
Sleep 1s
Enter
Sleep 18.5s
Type "touca server status"
Sleep 2s
Enter
Sleep 1s
Type "touca server logs"
Sleep 2s
Enter
Sleep 3s
Type "touca server upgrade"
Sleep 2s
Enter
Sleep 6s
Type "touca server uninstall"
Sleep 2s
Enter
Sleep 15s
Type "touca server --help"
Enter
Sleep 5s
