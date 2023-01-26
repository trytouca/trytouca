# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path
from subprocess import Popen, PIPE
from sys import stderr
from typing import Dict, List
from collections import defaultdict


def read_header(path: Path, number=1):
    with path.open() as f:
        for _ in range(number - 1):
            f.readline()
        return f.readline().rstrip()


proc = Popen(["git", "ls-files"], universal_newlines=True, stdout=PIPE, stderr=stderr)
proc.wait()

rules: Dict[str, str] = [
    {"ext": ".cmake", "style": "#"},
    {"ext": ".cpp", "style": "//"},
    {"ext": ".fbs", "style": "//"},
    {"ext": ".hpp", "style": "//"},
    {"ext": ".java", "style": "//"},
    {"ext": ".kts", "style": "//"},
    {"ext": ".py", "style": "#"},
    {"ext": ".scss", "style": "//"},
    {"ext": ".sh", "style": "#", "line": 2},
    {"ext": ".tape", "style": "#"},
    {"ext": ".txt", "style": "#", "name": "CMakeLists"},
    {"ext": ".ts", "style": "//"},
    {"ext": ".tsx", "style": "//"},
]
exclusion = [
    "app/src/polyfills.ts",
    "app/src/test.ts",
    "packages/flatbuffers/src/schema/generated/root.ts",
    "sdk/python/docs/conf.py",
    "sdk/python/touca/cli/__init__.py",
    "sdk/cpp/docs/sphinx/conf.py",
    "sdk/cpp/include/touca/impl/schema.hpp",
    "web/next-env.d.ts",
]
excluded_files = list(map(Path, exclusion))
counter = defaultdict(int)
missing: List[Path] = []

for path in map(Path, proc.stdout.read().splitlines()):
    if not path.exists() or path in excluded_files:
        continue
    rule = next((x for x in rules if path.suffix == x["ext"]), None)
    if not rule or "name" in rule and path.stem != rule["name"]:
        continue
    line = read_header(path, rule.get("line", 1))
    if line.startswith(f"{rule['style']} Copyright") and line.endswith(
        " Touca, Inc. Subject to Apache-2.0 License."
    ):
        year = line.split()[2]
        counter[year] += 1
        continue
    missing.append(path)

if missing:
    print("files with missing license headers:")
    for item in missing:
        print(f" -   {item}")
print(counter)
