.PHONY: docs test schema

test:
	pytest --cov=touca --cov-report=term --cov-report=html:local/tests \
		--cov-report=xml:local/tests/coverage.xml --disable-pytest-warnings tests

docs:
	sphinx-build -b html -c docs docs local/docs
