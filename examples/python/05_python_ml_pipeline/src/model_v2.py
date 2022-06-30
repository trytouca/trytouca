# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import joblib
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
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
y_train_binary_class = np.array([_ if _ == 3 else -1 for _ in y_train])
pipeline = Pipeline([("scaler", StandardScaler()), ("LR", LogisticRegression())])
pipeline.fit(x_train, y_train_binary_class)

joblib.dump(pipeline, "data/pipeline.bin")
