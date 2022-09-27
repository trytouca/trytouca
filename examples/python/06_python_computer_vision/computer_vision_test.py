# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import touca
from pathlib import Path
import computer_vision as code_under_test
from roboflow.util.prediction import Prediction

touca.add_serializer(Prediction, lambda x: x.json())


def find_testcases():
    for file in sorted(Path("images").glob("*.jpg")):
        yield file.stem


@touca.workflow(testcases=find_testcases)
def hard_hats(filename: str):
    input_file = Path("images").joinpath(filename).with_suffix(".jpg")
    output_file = Path("out").joinpath(filename).with_suffix(".jpg")

    with touca.scoped_timer("predict"):
        outcome = code_under_test.model.predict(str(input_file))
    output_file.parent.mkdir(exist_ok=True)
    outcome.save(str(output_file))

    touca.check("outcome", outcome)
    touca.check_file("input_file", input_file)
    touca.check_file("output_file", output_file)
