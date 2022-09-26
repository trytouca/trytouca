# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import touca
from pathlib import Path
from _model import model
from roboflow.util.prediction import Prediction

touca.add_serializer(Prediction, lambda x: x.json())


def find_testcases():
    for file in sorted(Path("images").glob("*.jpg")):
        yield file.stem


@touca.workflow(testcases=find_testcases)
def hard_hats(filename: str):
    with touca.scoped_timer("predict"):
        outcome = model.predict(f"images/{filename}.jpg")
    touca.check("image_dims", outcome.image_dims)
    touca.check("predictions", outcome.predictions)
    for item in outcome.predictions:
        touca.add_array_element(item["class"], item)
