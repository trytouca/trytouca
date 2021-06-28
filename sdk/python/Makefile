FBS_FILE=$(abspath $(shell pwd)/../../config/flatbuffers/touca.fbs)
FBS_OUTPUT_DIR=$(abspath $(shell pwd)/temp)
FBS_OUTPUT_FILE=$(abspath $(shell pwd)/touca/_schema.py)

.PHONY: docs test schema

test:
	pytest --cov=touca --cov-report=term --cov-report=html:local/tests \
		--disable-pytest-warnings tests

docs:
	sphinx-build -b html -c docs docs local/docs

schema:
	@rm -rf $(FBS_OUTPUT_DIR)
	@docker run --rm -v $(FBS_FILE):/opt/touca.fbs -v $(FBS_OUTPUT_DIR):/opt/dst ghorbanzade/flatc /opt/flatc --python -o /opt/dst /opt/touca.fbs
	@find $(FBS_OUTPUT_DIR) -name "__init__.py" -exec rm -rf {} \;
	@find $(FBS_OUTPUT_DIR) -name "*.py" -print | sort | xargs cat > $(FBS_OUTPUT_FILE)
	@rm -rf $(FBS_OUTPUT_DIR)
	@sed -i .bak '/# automatically/d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/# namespace/d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/import flatbuffers/d' $(FBS_OUTPUT_FILE)
	@sed -i .bak '/from .* import /d' touca/_schema.py
	@sed -i .bak '1s/^/import flatbuffers\'$$'\n/' $(FBS_OUTPUT_FILE)
	@black -q $(FBS_OUTPUT_FILE)
