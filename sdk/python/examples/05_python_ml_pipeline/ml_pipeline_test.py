import touca
import joblib
import numpy as np

pipeline = joblib.load("data/pipeline.bin")


@touca.Workflow
def pipeline_test(testcase: str):
    test_cases = joblib.load(testcase)
    y_test = pipeline.predict(test_cases)
    print(y_test)
    print(type(int(y_test[0])))
    touca.check("stage", int(y_test[0]))

# if __name__ == "__main__":
#     pipeline_test("data/test_cases.bin")
