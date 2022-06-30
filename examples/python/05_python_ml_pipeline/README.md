# How to track changes in the behavior of machine learning models using Touca

> This example was originally published as a [blog post](https://touca.io/blog)
> on June 30th, 2022.

Like any other software component, machine learning models evolve over time.
Data teams frequently make changes to their models to adjust and improve their
effectiveness in meeting business needs. Understanding the true impact of these
changes is essential but non-trivial.

Software engineering teams rely on a variety of testing tools and techniques to
continuously validate their code changes. But these tools are not equally
accessible or relevant to data teams. The common reasoning is that describing
the expected outcome of machine learning models is more difficult than that of
other software workflows. While this is true, part of the difficulty stems from
trying to describe the behavior of these models in such ways to fit the
requirements of established testing techniques like integration testing.

Touca, as a regression testing system, is well positioned to address this
difficulty and effectively solve the testing needs of most data teams. This
article showcases how Touca can help identify and evaluate changes in the
behavior of a simple classification algorithm.

## The Problem

Let's assume we have a database of cancerous and non-cancerous tumors. The
cancerous tumors fall into 3 categories depending on the progress of the
disease. These "stages" range from 1 (the most nascent) to 3 (the most
advanced).

Also assume that a particular treatment is available for patients with stage 3
tumors that is only advisable for this stage of the disease and could
significantly reduce the chance of success if tried in the earlier stages.

We would like to build a machine learning model that correctly diagnoses the
stage of disease for each patient. As data scientists we may have many ideas on
how to approach this problem. It is common that we would start with one
potential model and then use it as a baseline to evaluate future models.

In the following sections, we will go through this process step by step and
present two potential models for this problem. We will highlight how we can use
Touca to describe each model and to see how they compare against each other.

## Generating Synthetic Data

In real-world, we would have the data provided to us. Perhaps we will even have
a clinically verified _validation_ dataset reserved for evaluating and
monitoring the performance of our models. In this example, in the absence of
that data, we can use synthetic data instead. One very straightforward way of
doing so is using `scikit`'s `make_classification` method:

```python
from sklearn.datasets import make_classification

x, y = make_classification(
    n_samples=1000,
    n_classes=4,
    n_features=10,
    class_sep=5,
    n_redundant=0,
    n_informative=4,
    random_state=0,
)
```

We use n_samples to specify the number of samples, n_classes for the number of
classes (0 for non-cancerous cases and 1 to 3 for different stages of cancerous
cases), n_features for number of features including the number of redundant
(n_redundant) and informative (n_informative) features, and a random seed
`random_state` for replicability. In addition, the class_sep argument controls
the spread of classes and hence the easiness of classification, with larger
values making the task easier.

## Model 1: A Logistic Regression with Four Labels

Our first idea is to fit a logistic regression model to classify the records
into their four categories. We can start by splitting the data into training and
test data. We would standardize the features and fit our model. Among other
metrics, perhaps most importantly, we could review the performance of our model
on stage-3 cases.

Assuming we are happy with this performance, we may want to store our machine
learning pipeline for deployment. We can also store our test cases so we can use
them to validate future versions of our model.

```bash
python src/model_v1.py
```

But how do we capture how our current model performs on these cases? How could
we detect and describe how future versions perform in comparison with our
current model? While there is no one-size-fits-all answer for these questions,
Touca is particularly effective for describing the behavior of complex software
workflows for a large variety of input data.

## Describing the behavior of our model with Touca

Touca provides SDKs that help us submit the behavioral characteristics of our
model to a remote Touca Server instance. In this example, we can submit the
predicted outcome of our current model for each testcase. The server retains
this information for each version of our model. It automatically compares each
version against a baseline version and visualizes any differences in near
real-time.

In this example, let's use Touca's Python SDK to write our first Touca test:

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

## Model 2: A Logistic Regression with Two Labels: Stage-3 vs. Other

Now that we have deployed our first model and have a baseline of how it performs
on our test cases, we can proceed with exploring other ideas on how to approach
our classification problem:

If we particularly care about detecting stage-3 cases, wouldn't it make sense to
use binary classification instead? Our model could flag stage-3 cases against
all other cases of non-cancerous and nascent cases. It is tempting to consider
this model with the argument that it may be potential faster and more effective
than our previous 4-label classification model.

```bash
python src/model_v2.py
```

Assuming we are happy with the implementation, we can now store this new model
locally or as part of CI, to evaluate it against our previous baseline.
Depending on this evaluation, we can then choose whether to proceed with
deploying this new version to production.

## Comparing against baseline

Fortunately, with Touca, we can reuse our previous test to submit the new
behavior to the server and let it compare our the behavior against our baseline.

```bash
touca test --revision=v2.0 --testdir=test
```

In this example, it is fairly easy to observe that the new version mis-diagnoses
several the stage-3 test cases. This information can help us decide that this
new model may not serve as a good improvement to our previous model, regardless
of its basic metrics such as accuracy score.
