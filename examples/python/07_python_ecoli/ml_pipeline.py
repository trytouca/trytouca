# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pandas import read_csv  # For dataframes
from pandas import DataFrame  # For dataframes
from numpy import ravel  # For matrices
import matplotlib.pyplot as plt  # For plotting data
import seaborn as sns  # For plotting data
from sklearn.model_selection import train_test_split  # For train/test splits
from sklearn.neighbors import KNeighborsClassifier  # The k-nearest neighbor classifier
from sklearn.feature_selection import VarianceThreshold  # Feature selector
from sklearn.pipeline import Pipeline  # For setting up pipeline

# Various pre-processing steps
from sklearn.preprocessing import (
    Normalizer,
    StandardScaler,
    MinMaxScaler,
    PowerTransformer,
    MaxAbsScaler,
    LabelEncoder,
)
from sklearn.model_selection import GridSearchCV  # For optimization
from pathlib import Path
import joblib
import os


# Obtain and process training and test data
# This data comes from the ecoli dataset from the UCI ML Repository
df = read_csv(
    "https://archive.ics.uci.edu/ml/machine-learning-databases/ecoli/ecoli.data",
    sep="\s+",
    header=None,
)

print(df)

X = df.iloc[:, 1:-1]
y = df.iloc[:, -1:]
encoder = LabelEncoder()
y = encoder.fit_transform(ravel(y))
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=1 / 3, random_state=0
)

# Constructs a simple ml pipeline
pipe = Pipeline(
    [
        ("scaler", StandardScaler()),
        ("selector", VarianceThreshold()),
        ("classifier", KNeighborsClassifier()),
    ]
)

pipe.fit(X_train, y_train)

# Test results of pipeline
print("Test set score: " + str(pipe.score(X_test, y_test)))

data_dir = Path("data")
data_dir.mkdir(exist_ok=True)

# Store pipeline as binary file in data/pipeline.bin
joblib.dump(pipe, data_dir.joinpath("pipeline.bin"))

# Store test data in data/testcases.txt so that it can be used by Touca
try:
    os.remove("data/testcases.txt")
except:
    pass

with data_dir.joinpath("testcases.txt").open("a") as f:
    for ind, data in X_test.iterrows():
        test_case = " ".join([str(x) for x in data.array])
        f.write(test_case + "\n")
