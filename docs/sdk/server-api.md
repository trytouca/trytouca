# Server API

### Authentication

{% swagger src="../.gitbook/assets/swagger.yaml" path="/auth/signin" method="post" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

### Learning about Test Suites

{% swagger src="../.gitbook/assets/swagger.yaml" path="/suite/:team" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

{% swagger src="../.gitbook/assets/swagger.yaml" path="/suite/:team/:suite" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

### Learning about Versions

{% swagger src="../.gitbook/assets/swagger.yaml" path="/batch/:team/:suite" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

{% swagger src="../.gitbook/assets/swagger.yaml" path="/batch/:team/:suite/:batch" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

### Learning about Test Cases

{% swagger src="../.gitbook/assets/swagger.yaml" path="/element/:team/:suite" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

{% swagger src="../.gitbook/assets/swagger.yaml" path="/element/:team/:suite/:element" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

### Comparing Test Results

{% swagger src="../.gitbook/assets/swagger.yaml" path="/batch/:team/:suite/:batch/compare/:dstBatch/:dstSuite" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}

{% swagger src="../.gitbook/assets/swagger.yaml" path="/element/:team/:suite/:element/compare/:batch/:dstBatch/:dstElement/:dstSuite" method="get" %}
[swagger.yaml](../.gitbook/assets/swagger.yaml)
{% endswagger %}
