FBS_FILE=$(abspath $(shell pwd)/../../config/flatbuffers/touca.fbs)
FBS_OUTPUT_DIR=$(abspath $(shell pwd)/temp)
FBS_OUTPUT_FILE=$(abspath $(shell pwd)/touca/_schema.py)

.PHONY: docs test schema

test:
	pytest --cov=touca --cov-report=term --cov-report=html:local/tests \
		--cov-report=xml:local/tests/coverage.xml --disable-pytest-warnings tests

docs:
	sphinx-build -b html -c docs docs local/docs

schema:
	@rm -rf $(FBS_OUTPUT_DIR)
	@flatc --gen-onefile --python -o $(FBS_OUTPUT_DIR) $(FBS_FILE)
	@mv $(FBS_OUTPUT_DIR)/touca_generated.py $(FBS_OUTPUT_FILE)
	@rm -rf $(FBS_OUTPUT_DIR)
	@sed -i .bak '/# automatically/d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/# namespace/d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/from .* import /d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/np = import_numpy()/d' $(FBS_OUTPUT_FILE)
	@black -q $(FBS_OUTPUT_FILE)
