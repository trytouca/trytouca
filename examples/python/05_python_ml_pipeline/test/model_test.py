# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import touca
import joblib
import numpy as np

pipeline = joblib.load("data/pipeline.bin")


@touca.Workflow
def pipeline_test(testcase: str):
    testcase_input = np.fromfile(f"data/testcases/{testcase}.bin", dtype=float)
    outcome = pipeline.predict([testcase_input])[0]
    touca.check("stage", outcome.item())
