# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import csv
from pathlib import Path

import joblib
import touca

out_dir = Path("out")
pipeline = joblib.load(out_dir.joinpath("pipeline.bin"))

reader = csv.reader(out_dir.joinpath("testcases.csv").open(mode="r"))
inputs = {row[0]: row[1:] for row in reader}


@touca.workflow(testcases=list(inputs.keys()))
def pipeline_test(name: str):
    data = [float(x) for x in inputs[name]]
    y_test = pipeline.predict([data])[0]
    touca.check("stage", y_test.item())
