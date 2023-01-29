# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

Output touca-run-js.dark.gif
Set Theme "Builtin Tango Dark"

Set FontSize 32
Set Width 1366
Set Height 768
Require touca

Hide
Type "clear"
Enter
Show

Sleep 800ms
Type "touca config set api-key="
Sleep 100ms
Type@2ms "4f214258-1378-4665-919e-38799836335c"
Enter
Sleep 500ms
Type "touca config set api-url="
Sleep 100ms
Type@2ms "https://api.touca.io/@/demo"
Enter
Sleep 500ms
Type "npm run test:touca"
Enter
Sleep 6000ms
