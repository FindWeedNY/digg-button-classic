.PHONY: test lint format build clean release help

# Default target
help:
	@echo "Usage:"
	@echo "  make test              Run tests"
	@echo "  make lint              Run linter"
	@echo "  make format            Format code with prettier"
	@echo "  make build             Build extension packages"
	@echo "  make clean             Remove built packages"
	@echo "  make release VERSION=X.Y.Z   Release a new version"
	@echo ""
	@echo "Example:"
	@echo "  make release VERSION=1.1.0"

test:
	npm test

lint:
	npm run lint

format:
	npm run format

build:
	./build.sh

clean:
	rm -f *.xpi *.zip
	rm -rf build/

# Release process:
# 1. Update version in all files
# 2. Run tests and lint
# 3. Build
# 4. Commit, tag, and push
release:
ifndef VERSION
	$(error VERSION is required. Usage: make release VERSION=1.1.0)
endif
	@echo "Releasing version $(VERSION)..."
	@echo ""
	@# Update versions in all files
	@echo "Updating versions..."
	sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json
	sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' manifest.json
	sed -i 's/"version": "[^"]*"/"version": "$(VERSION)"/' manifest.chrome.json
	@echo ""
	@# Run checks
	@echo "Running tests..."
	npm test
	@echo ""
	@echo "Running linter..."
	npm run lint
	@echo ""
	@# Build
	@echo "Building..."
	./build.sh
	@echo ""
	@# Git operations
	@echo "Committing..."
	git add package.json manifest.json manifest.chrome.json
	git commit -m "Release v$(VERSION)"
	@echo ""
	@echo "Tagging v$(VERSION)..."
	git tag "v$(VERSION)"
	@echo ""
	@echo "Pushing to origin..."
	git push origin main
	git push origin "v$(VERSION)"
	@echo ""
	@echo "============================================"
	@echo " Released v$(VERSION)!"
	@echo "============================================"
	@echo ""
	@echo " CI will create the GitHub release automatically."
	@echo " Check: https://github.com/FindWeedNY/digg-button-classic/releases"
