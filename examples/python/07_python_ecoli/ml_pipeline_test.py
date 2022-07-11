# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from array import array
import touca
import joblib
import numpy as np


@touca.Workflow
def pipeline_test(testcase: str):
    pipeline = joblib.load("data/pipeline.bin")
    test_case = [float(x) for x in testcase.split(" ")]
    y_test = pipeline.predict([test_case])[0]
    touca.check("stage", y_test.item())
