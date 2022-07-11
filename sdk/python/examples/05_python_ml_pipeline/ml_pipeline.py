from pandas import read_csv                           # For dataframes
from pandas import DataFrame                       # For dataframes
from numpy import ravel                                  # For matrices
import matplotlib.pyplot as plt                        # For plotting data
import seaborn as sns                                     # For plotting data
from sklearn.model_selection import train_test_split    # For train/test splits
from sklearn.neighbors import KNeighborsClassifier    # The k-nearest neighbor classifier
from sklearn.feature_selection import VarianceThreshold # Feature selector
from sklearn.pipeline import Pipeline                                  # For setting up pipeline
# Various pre-processing steps
from sklearn.preprocessing import Normalizer, StandardScaler, MinMaxScaler, PowerTransformer, MaxAbsScaler, LabelEncoder
from sklearn.model_selection import GridSearchCV      # For optimization
from pathlib import Path
import joblib

# Read ecoli dataset from the UCI ML Repository and store in
# dataframe df
df = read_csv(
    'https://archive.ics.uci.edu/ml/machine-learning-databases/ecoli/ecoli.data',
    sep = '\s+',
    header=None)
print(df.head())

# The data matrix X
X = df.iloc[:,1:-1]
# The labels
y = (df.iloc[:,-1:])

# Encode the labels into unique integers
encoder = LabelEncoder()
y = encoder.fit_transform(ravel(y))

# Split the data into test and train
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=1/3,
    random_state=0)

print(X_train.shape)
print(y_train.shape)
print(X_test.shape)
print(y_test.shape)

# knn = KNeighborsClassifier().fit(X_train, y_train)
# print('Training set score: ' + str(knn.score(X_train,y_train)))
# print('Test set score: ' + str(knn.score(X_test,y_test)))

pipe = Pipeline([
('scaler', StandardScaler()),
('selector', VarianceThreshold()),
('classifier', KNeighborsClassifier())
])

pipe.fit(X_train, y_train)

print('Training set score: ' + str(pipe.score(X_train,y_train)))
print('Test set score: ' + str(pipe.score(X_test,y_test)))

data_dir = Path("data")
data_dir.mkdir(exist_ok=True)
joblib.dump(pipe, data_dir.joinpath("pipeline.bin"))

joblib.dump(X_test, data_dir.joinpath("test_cases.bin"))

# parameters = {'scaler': [StandardScaler(), MinMaxScaler(),
# 	Normalizer(), MaxAbsScaler()],
# 	'selector__threshold': [0, 0.001, 0.01],
# 	'classifier__n_neighbors': [1, 3, 5, 7, 10],
# 	'classifier__p': [1, 2],
# 	'classifier__leaf_size': [1, 5, 10, 15]
# }

# grid = GridSearchCV(pipe, parameters, cv=2).fit(X_train, y_train)

# print('Training set score: ' + str(grid.score(X_train, y_train)))
# print('Test set score: ' + str(grid.score(X_test, y_test)))

# # Access the best set of parameters
# best_params = grid.best_params_
# print(best_params)
# # Stores the optimum model in best_pipe
# best_pipe = grid.best_estimator_
# print(best_pipe)

# result_df = DataFrame.from_dict(grid.cv_results_, orient='columns')
# print(result_df.columns)

# sns.relplot(data=result_df,
# 	kind='line',
# 	x='param_classifier__n_neighbors',
# 	y='mean_test_score',
# 	hue='param_scaler',
# 	col='param_classifier__p')
# plt.show()

# sns.relplot(data=result_df,
#             kind='line',
#             x='param_classifier__n_neighbors',
#             y='mean_test_score',
#             hue='param_scaler',
#             col='param_classifier__leaf_size')
# plt.show()