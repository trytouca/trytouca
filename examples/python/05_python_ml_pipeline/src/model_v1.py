# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path

import joblib
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

x, y = make_classification(
    n_samples=1000,
    n_classes=4,
    n_features=10,
    class_sep=5,
    n_redundant=0,
    n_informative=4,
    random_state=0,
)

x_train, x_test, y_train, y_test = train_test_split(x, y, random_state=0)
pipeline = Pipeline([("scaler", StandardScaler()), ("LR", LogisticRegression())])
pipeline.fit(x_train, y_train)

stage_3_x_test = x_test[y_test == 3]
stage_3_y_test = y_test[y_test == 3]
accuracy = accuracy_score(
    y_true=stage_3_y_test, y_pred=pipeline.predict(stage_3_x_test), normalize=True
)
# print(f"Prediction accuracy of stage 3 cases: {accuracy.round(4)}")

data_dir = Path("data")
data_dir.mkdir(exist_ok=True)
joblib.dump(pipeline, data_dir.joinpath("pipeline.bin"))

testcase_dir = data_dir.joinpath("testcases")
testcase_dir.mkdir(parents=True, exist_ok=True)
# store the numerical data for each case in a separate binary file
for idx, input in enumerate(stage_3_x_test):
    filepath = testcase_dir.joinpath(f"testcase-{idx}").with_suffix(".bin")
    input.tofile(filepath)

# store the list of all test cases in `testcases.txt`
testcases = [x.stem for x in testcase_dir.glob("*.bin")]
testcases.sort()
data_dir.joinpath("testcases.txt").write_text("\n".join(testcases))
