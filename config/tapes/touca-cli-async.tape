# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-cli-async.dark.gif
Set Theme "Builtin Tango Dark"

Set FontSize 32
Set Width 1366
Set Height 768
Require python
Require touca

Hide
Type "clear"
Enter
Show

Sleep 800ms
Type "touca config set submit_async=true"
Sleep 200ms
Enter
Sleep 1s
Type "touca test"
Enter
Sleep 4000ms
