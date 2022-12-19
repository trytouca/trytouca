# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from pandas import read_csv
from numpy import ravel
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from pathlib import Path
from faker import Faker
import joblib
import csv

df = read_csv(
    "https://archive.ics.uci.edu/ml/machine-learning-databases/ecoli/ecoli.data",
    sep="\s+",
    header=None,
)

x = df.iloc[:, 1:-1]
y = df.iloc[:, -1:]
encoder = LabelEncoder()
y = encoder.fit_transform(ravel(y))
x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=1 / 3, random_state=0
)

pipe = Pipeline(
    [
        ("scaler", StandardScaler()),
        ("selector", VarianceThreshold()),
        ("classifier", KNeighborsClassifier()),
    ]
)
pipe.fit(x_train, y_train)

out_dir = Path("out")
out_dir.mkdir(exist_ok=True)
joblib.dump(pipe, out_dir.joinpath("pipeline.bin"))

faker = Faker()
out_dir.joinpath("testcases.csv").unlink(missing_ok=True)
with out_dir.joinpath("testcases.csv").open(mode="w") as file:
    writer = csv.writer(file)
    for ind, data in x_test.iterrows():
        cols = list(map(str, data.array))
        cols.insert(0, faker.name())
        writer.writerow(cols)
