# How to track changes in the behavior of machine learning models using Touca

## The Data

Each datapoint contains:

1. Sequence Name: Accession number for the SWISS-PROT database
2. mcg: McGeoch's method for signal sequence recognition.
3. gvh: von Heijne's method for signal sequence recognition.
4. lip: von Heijne's Signal Peptidase II consensus sequence score. Binary
   attribute.
5. chg: Presence of charge on N-terminus of predicted lipoproteins. Binary
   attribute.
6. aac: score of discriminant analysis of the amino acid content of outer
   membrane and periplasmic proteins.
7. alm1: score of the ALOM membrane spanning region prediction program.
8. alm2: score of ALOM program after excluding putative cleavable signal regions
   from the sequence

## The objective

We must predict the sequence name from the 7 numberical values: mcg, gvh, lip,
chg, aac, alm1, alm2

## The pipeline

We construct a simple sklearn pipeline and train it.

```python
from sklearn.pipeline import Pipeline

pipe = Pipeline([
  ('scaler', StandardScaler()),
  ('selector', VarianceThreshold()),
  ('classifier', KNeighborsClassifier())
])

pipe.fit(X_train, y_train)
```

## Recording Results

Store testcases so that it can later be used by Touca in ml_pipeline.py:

```python
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)

joblib.dump(pipe, data_dir.joinpath("pipeline.bin"))

try:
    os.remove("data/testcases.txt")
except:
    pass
with data_dir.joinpath("testcases.txt").open("a") as f:
    for ind, data in X_test.iterrows():
        test_case = " ".join([str(x) for x in data.array])
        f.write(test_case + "\n")
```

Load and register predictions in ml_pipeline_test.py

```python
@touca.Workflow
def pipeline_test(testcase: str):
    pipeline = joblib.load("data/pipeline.bin")
    test_case = [float(x) for x in testcase.split(" ")]
    y_test = pipeline.predict([test_case])[0]
    touca.check("stage", y_test.item())
```

## Testing

Config Touca if needed:

```bash
pip install touca --quiet
touca config set api-key=<TOUCA_API_KEY>
touca config set api-url=<TOUCA_API_URL>
touca test --revision=v1.0 --testdir=test --testcase-file=data/testcases.txt
```

Where the options `api_key` and `api-url` are obtained from the Touca Server,
self-hosted locally or deployed in the [Cloud](https://app.touca.io), `revision`
is any string representation of the version of our code under test, and
`testcase_file` points to a list of our testcases.

> Click [here](https://touca.io/docs/basics/account-setup) for step-by-step
> instructions to create an account and obtain your API credentials.

Run touca test:

```bash
touca test --revision=v1.0 --testcase-file=data/testcases.txt
```
