# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

Output touca-run-java.dark.gif
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
Type "export TOUCA_API_KEY="
Sleep 100ms
Type@2ms "1f3e724a-f814-40c0-bbc7-61bfc8aa3ab8"
Enter
Sleep 500ms
Type "export TOUCA_API_URL="
Sleep 100ms
Type@2ms "http://localhost:8080/api"
Enter
Sleep 500ms
Type "gradle runSampleApp --args='--revision 1.0 --testcase alice bob charlie --team acme --suite students' --warning-mode=none"
Enter
Sleep 6000ms
