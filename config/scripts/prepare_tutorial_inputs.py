# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path
from shutil import copyfile, rmtree, make_archive
from json import dumps
import computer_vision as code_under_test

tutorial_dir = Path.cwd().joinpath("tutorial")
if tutorial_dir.exists():
    rmtree(tutorial_dir)
for idx, model_version in enumerate([2, 4]):
    version = f"v1.{idx}"
    version_dir = tutorial_dir.joinpath(version)
    for input_file in sorted(Path("images").glob("*.jpg")):
        outcome = code_under_test.project.version(model_version).model.predict(
            str(input_file)
        )
        output = [
            {k: v for k, v in item.items() if k in ["x", "y", "width", "height"]}
            for item in outcome.json()["predictions"]
        ]
        output_dir = version_dir.joinpath(input_file.stem)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_dir.joinpath("output.json").write_text(dumps(output))
        copyfile(input_file, output_dir.joinpath("input.jpg"))
        outcome.save(str(output_dir.joinpath("output.jpg")))
    make_archive(version, "zip", version_dir)
    rmtree(version_dir)
