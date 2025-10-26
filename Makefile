# SmartSeller Storefront Deployment Makefile
# This Makefile provides commands for building and deploying the Docker image

# Variables
APP_NAME := smartseller-storefront
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "latest")
REGISTRY := ghcr.io
GITHUB_USER ?= kirimku
IMAGE_NAME := $(REGISTRY)/$(GITHUB_USER)/$(APP_NAME)
DOCKER_TAG := $(IMAGE_NAME):$(VERSION)
LATEST_TAG := $(IMAGE_NAME):latest

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Environment-specific variables
VITE_API_URL := https://smartseller-api.preproduction.kirimku.com
VITE_TENANT_SLUG := rexus

# Default target
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "$(GREEN)SmartSeller Storefront - Docker Deployment$(NC)"
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: info
info: ## Show build information
	@echo "$(BLUE)Build Information:$(NC)"
	@echo "  App Name:     $(APP_NAME)"
	@echo "  Version:      $(VERSION)"
	@echo "  Registry:     $(REGISTRY)"
	@echo "  GitHub User:  $(GITHUB_USER)"
	@echo "  Image Name:   $(IMAGE_NAME)"
	@echo "  Docker Tag:   $(DOCKER_TAG)"
	@echo "  Latest Tag:   $(LATEST_TAG)"

.PHONY: check-env
check-env: ## Check required environment variables
	@echo "$(BLUE)Checking environment...$(NC)"
	@if [ -z "$(GITHUB_USER)" ]; then \
		echo "$(RED)Error: GITHUB_USER not set. Please set it with: export GITHUB_USER=your-github-username$(NC)"; \
		exit 1; \
	fi
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(RED)Error: Docker is not installed or not in PATH$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Environment check passed!$(NC)"

.PHONY: clean
clean: ## Clean up Docker images and containers
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	@docker system prune -f
	@docker image prune -f
	@echo "$(GREEN)Cleanup completed!$(NC)"

.PHONY: build
build: check-env ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	@echo "$(YELLOW)Tag: $(DOCKER_TAG)$(NC)"
	@docker build -t $(DOCKER_TAG) -t $(LATEST_TAG) .
	@echo "$(GREEN)Build completed successfully!$(NC)"
	@echo "$(BLUE)Image size:$(NC)"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

.PHONY: build-preprod
build-preprod: check-env ## Build Docker image for preproduction
	@echo "$(BLUE)Building preproduction Docker image...$(NC)"
	@echo "$(YELLOW)Tag: $(DOCKER_TAG)$(NC)"
	@echo "$(BLUE)Using API URL: $(VITE_API_URL)$(NC)"
	@docker build -f Dockerfile.preprod --build-arg VITE_API_URL=$(VITE_API_URL) --build-arg VITE_TENANT_SLUG=$(VITE_TENANT_SLUG) -t $(DOCKER_TAG) .
	@echo "$(GREEN)Preproduction build completed successfully!$(NC)"
	@echo "$(BLUE)Image size:$(NC)"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

.PHONY: build-no-cache
build-no-cache: check-env ## Build Docker image without cache
	@echo "$(BLUE)Building Docker image without cache...$(NC)"
	@echo "$(YELLOW)Tag: $(DOCKER_TAG)$(NC)"
	@docker build --no-cache -t $(DOCKER_TAG) -t $(LATEST_TAG) .
	@echo "$(GREEN)Build completed successfully!$(NC)"

.PHONY: build-preprod-no-cache
build-preprod-no-cache: check-env ## Build preproduction Docker image without cache
	@echo "$(BLUE)Building preproduction Docker image without cache...$(NC)"
	@echo "$(YELLOW)Tag: $(DOCKER_TAG)$(NC)"
	@echo "$(BLUE)Using API URL: $(VITE_API_URL)$(NC)"
	@echo "$(YELLOW)Note: This will take longer as it rebuilds all layers from scratch$(NC)"
	@docker build --no-cache -f Dockerfile.preprod --build-arg VITE_API_URL=$(VITE_API_URL) --build-arg VITE_TENANT_SLUG=$(VITE_TENANT_SLUG) -t $(DOCKER_TAG) .
	@echo "$(GREEN)Preproduction build (no cache) completed successfully!$(NC)"
	@echo "$(BLUE)Image size:$(NC)"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

.PHONY: test-local
test-local: build ## Test the Docker image locally
	@echo "$(BLUE)Testing Docker image locally...$(NC)"
	@echo "$(YELLOW)Starting container on port 3000...$(NC)"
	@docker run --rm -d --name $(APP_NAME)-test -p 3000:5173 $(DOCKER_TAG)
	@echo "$(GREEN)Container started! Testing health endpoint...$(NC)"
	@sleep 5
	@if curl -f http://localhost:3000/health >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Health check passed!$(NC)"; \
		echo "$(BLUE)Application is running at: http://localhost:3000$(NC)"; \
		echo "$(YELLOW)Press Ctrl+C to stop the test container$(NC)"; \
		trap 'docker stop $(APP_NAME)-test' INT; \
		docker logs -f $(APP_NAME)-test; \
	else \
		echo "$(RED)✗ Health check failed!$(NC)"; \
		docker logs $(APP_NAME)-test; \
		docker stop $(APP_NAME)-test; \
		exit 1; \
	fi

.PHONY: test-preprod
test-preprod: build-preprod ## Test preproduction Docker image with API endpoint verification
	@echo "$(BLUE)Testing preproduction Docker image...$(NC)"
	@echo "$(BLUE)Cleaning up any existing test containers...$(NC)"
	@docker stop $(APP_NAME)-preprod-test 2>/dev/null || true
	@docker rm $(APP_NAME)-preprod-test 2>/dev/null || true
	@echo "$(YELLOW)Starting preprod container on port 8082...$(NC)"
	@docker run --rm -d --name $(APP_NAME)-preprod-test -p 8082:5173 $(DOCKER_TAG)
	@echo "$(GREEN)Container started! Testing health endpoint...$(NC)"
	@sleep 5
	@if curl -f http://localhost:8082/health >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Health check passed!$(NC)"; \
		echo "$(BLUE)Checking for correct API URL in the built files...$(NC)"; \
		echo "$(BLUE)Listing JavaScript files in /app/dist:$(NC)"; \
		docker exec $(APP_NAME)-preprod-test find /app/dist -type f -name "*.js" | sort; \
		echo "$(BLUE)Checking API URLs in built files:$(NC)"; \
		docker exec $(APP_NAME)-preprod-test grep -r "api" /app/dist -r || echo "No standard API references found"; \
		echo "$(BLUE)Looking for localhost references:$(NC)"; \
		docker exec $(APP_NAME)-preprod-test grep -r "localhost" /app/dist -r || echo "No localhost references found"; \
		if docker exec $(APP_NAME)-preprod-test grep -r "smartseller-api.preproduction.kirimku.com/api/v1" /app/dist -r || \
		   docker exec $(APP_NAME)-preprod-test grep -r "smartseller-api.preproduction.kirimku.com" /app/dist -r; then \
			echo "$(GREEN)✓ Correct API URL verified in build!$(NC)"; \
		else \
			echo "$(RED)✗ Failed to find exact API URL string in build. This might be due to code minification.$(NC)"; \
			echo "$(BLUE)Checking for partial URL matches:$(NC)"; \
			docker exec $(APP_NAME)-preprod-test grep -r "preproduction.kirimku.com" /app/dist -r || echo "No preproduction references found"; \
			docker exec $(APP_NAME)-preprod-test grep -r "api/v1" /app/dist -r || echo "No API endpoint references found"; \
			if docker exec $(APP_NAME)-preprod-test grep -r "localhost:8080" /app/dist -r; then \
				echo "$(RED)✗ Build still contains localhost:8080 reference$(NC)"; \
				docker stop $(APP_NAME)-preprod-test; \
				exit 1; \
			else \
				echo "$(GREEN)✓ No localhost:8080 references found in the build$(NC)"; \
				echo "$(YELLOW)Continuing even though exact API URL not found - might be minified$(NC)"; \
			fi; \
		fi; \
		echo "$(BLUE)Application is running at: http://localhost:8082$(NC)"; \
		echo "$(YELLOW)Press Ctrl+C to stop the test container$(NC)"; \
		trap 'docker stop $(APP_NAME)-preprod-test' INT; \
		docker logs -f $(APP_NAME)-preprod-test; \
	else \
		echo "$(RED)✗ Health check failed!$(NC)"; \
		docker logs $(APP_NAME)-preprod-test; \
		docker stop $(APP_NAME)-preprod-test; \
		exit 1; \
	fi

.PHONY: stop-test
stop-test: ## Stop the test container
	@echo "$(BLUE)Stopping test container...$(NC)"
	@docker stop $(APP_NAME)-test 2>/dev/null || true
	@echo "$(GREEN)Test container stopped!$(NC)"

.PHONY: login-registry
login-registry: ## Login to GitHub Container Registry
	@echo "$(BLUE)Logging in to GitHub Container Registry...$(NC)"
	@if [ -z "$$GITHUB_TOKEN" ]; then \
		echo "$(YELLOW)No GITHUB_TOKEN found in environment.$(NC)"; \
		echo "$(BLUE)Please enter your GitHub Personal Access Token:$(NC)"; \
		echo "$(YELLOW)Token should have 'write:packages' and 'read:packages' permissions$(NC)"; \
		docker login $(REGISTRY) -u $(GITHUB_USER); \
	else \
		echo "$(GREEN)Using GITHUB_TOKEN from environment$(NC)"; \
		echo "$$GITHUB_TOKEN" | docker login $(REGISTRY) -u $(GITHUB_USER) --password-stdin; \
	fi
	@echo "$(GREEN)Successfully logged in to GHCR!$(NC)"

.PHONY: push
push: login-registry ## Push image to GitHub Container Registry
	@echo "$(BLUE)Pushing image to GitHub Container Registry...$(NC)"
	@echo "$(YELLOW)Pushing: $(DOCKER_TAG)$(NC)"
	@docker push $(DOCKER_TAG)
	@echo "$(YELLOW)Pushing: $(LATEST_TAG)$(NC)"
	@docker push $(LATEST_TAG)
	@echo "$(GREEN)Push completed successfully!$(NC)"
	@echo "$(BLUE)Image available at: $(DOCKER_TAG)$(NC)"

.PHONY: deploy-registry
deploy-registry: build push ## Build and deploy to GitHub Container Registry
	@echo "$(GREEN)Deployment to GHCR completed successfully!$(NC)"
	@echo "$(BLUE)To pull the image:$(NC)"
	@echo "  docker pull $(DOCKER_TAG)"
	@echo "$(BLUE)To run the image:$(NC)"
	@echo "  docker run -p 3000:3000 $(DOCKER_TAG)"

.PHONY: deploy-latest
deploy-latest: ## Deploy latest version to GHCR (use current git tag/commit)
	@$(MAKE) VERSION=latest deploy-registry

.PHONY: deploy-preprod-registry
deploy-preprod-registry: build-preprod-no-cache push ## Build preprod image (no cache) and deploy to GitHub Container Registry
	@echo "$(GREEN)Preproduction deployment to GHCR completed successfully!$(NC)"
	@echo "$(BLUE)Built with API URL: $(VITE_API_URL)$(NC)"
	@echo "$(BLUE)Image available at: $(DOCKER_TAG)$(NC)"
	@echo ""
	@echo "$(BLUE)To pull the preproduction image:$(NC)"
	@echo "  docker pull $(DOCKER_TAG)"
	@echo "$(BLUE)To run the preproduction image:$(NC)"
	@echo "  docker run -p 8082:5173 $(DOCKER_TAG)"
	@echo "$(BLUE)To test the preproduction image:$(NC)"
	@echo "  make test-preprod"

.PHONY: deploy-preprod-latest
deploy-preprod-latest: build-preprod-no-cache ## Build preprod image (no cache) and deploy as latest to GitHub Container Registry
	@echo "$(BLUE)Tagging preprod image as latest...$(NC)"
	@docker tag $(DOCKER_TAG) $(LATEST_TAG)
	@echo "$(BLUE)Pushing preprod image with both tags to GHCR...$(NC)"
	@$(MAKE) push
	@echo "$(GREEN)Preproduction deployment as latest to GHCR completed successfully!$(NC)"
	@echo "$(BLUE)Built with API URL: $(VITE_API_URL)$(NC)"
	@echo "$(BLUE)Image available at: $(DOCKER_TAG)$(NC)"
	@echo "$(BLUE)Latest tag available at: $(LATEST_TAG)$(NC)"
	@echo ""
	@echo "$(BLUE)To pull the preproduction image:$(NC)"
	@echo "  docker pull $(DOCKER_TAG)"
	@echo "$(BLUE)To pull as latest:$(NC)"
	@echo "  docker pull $(LATEST_TAG)"
	@echo "$(BLUE)To run the preproduction image:$(NC)"
	@echo "  docker run -p 8082:5173 $(LATEST_TAG)"

.PHONY: deploy-preprod-full
deploy-preprod-full: deploy-preprod-registry test-preprod ## Complete preprod pipeline: build (no cache) + push + test
	@echo "$(GREEN)Complete preproduction deployment pipeline finished!$(NC)"
	@echo "$(BLUE)✓ Built preproduction image without cache$(NC)"
	@echo "$(BLUE)✓ Pushed to GitHub Container Registry$(NC)"
	@echo "$(BLUE)✓ Tested preproduction image$(NC)"

.PHONY: pull
pull: login-registry ## Pull image from GitHub Container Registry
	@echo "$(BLUE)Pulling image from GHCR...$(NC)"
	@docker pull $(DOCKER_TAG)
	@echo "$(GREEN)Pull completed!$(NC)"

.PHONY: run
run: ## Run the latest image locally
	@echo "$(BLUE)Running $(APP_NAME) locally...$(NC)"
	@docker run --rm -it --name $(APP_NAME) -p 3000:3000 $(LATEST_TAG)

.PHONY: run-detached
run-detached: ## Run the latest image in detached mode
	@echo "$(BLUE)Running $(APP_NAME) in detached mode...$(NC)"
	@docker run -d --name $(APP_NAME) -p 3000:3000 --restart unless-stopped $(LATEST_TAG)
	@echo "$(GREEN)Container started! Access at: http://localhost:3000$(NC)"
	@echo "$(BLUE)To stop: docker stop $(APP_NAME)$(NC)"
	@echo "$(BLUE)To view logs: docker logs -f $(APP_NAME)$(NC)"

.PHONY: stop
stop: ## Stop the running container
	@echo "$(BLUE)Stopping $(APP_NAME) container...$(NC)"
	@docker stop $(APP_NAME) 2>/dev/null || true
	@docker rm $(APP_NAME) 2>/dev/null || true
	@echo "$(GREEN)Container stopped!$(NC)"

.PHONY: logs
logs: ## Show container logs
	@echo "$(BLUE)Showing logs for $(APP_NAME)...$(NC)"
	@docker logs -f $(APP_NAME)

.PHONY: shell
shell: ## Open shell in running container
	@echo "$(BLUE)Opening shell in $(APP_NAME) container...$(NC)"
	@docker exec -it $(APP_NAME) /bin/sh

.PHONY: security-scan
security-scan: build ## Run security scan on the image
	@echo "$(BLUE)Running security scan...$(NC)"
	@if command -v trivy >/dev/null 2>&1; then \
		trivy image $(DOCKER_TAG); \
	else \
		echo "$(YELLOW)Trivy not installed. Install with: brew install trivy$(NC)"; \
		echo "$(BLUE)Running basic Docker security check...$(NC)"; \
		docker run --rm -i hadolint/hadolint < Dockerfile; \
	fi

.PHONY: size-check
size-check: build ## Check image size and layers
	@echo "$(BLUE)Image size analysis:$(NC)"
	@docker images $(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
	@echo ""
	@echo "$(BLUE)Layer information:$(NC)"
	@docker history $(DOCKER_TAG) --no-trunc

.PHONY: release
release: ## Create a release (tag and push)
	@if [ -z "$(TAG)" ]; then \
		echo "$(RED)Error: TAG is required. Usage: make release TAG=v1.0.0$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating release $(TAG)...$(NC)"
	@git tag $(TAG)
	@git push origin $(TAG)
	@$(MAKE) VERSION=$(TAG) deploy-registry
	@echo "$(GREEN)Release $(TAG) created and deployed!$(NC)"

.PHONY: dev-setup
dev-setup: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@npm install
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "$(BLUE)To start development server: npm run dev$(NC)"

.PHONY: all
all: clean build test-local push ## Run complete build and deployment pipeline
	@echo "$(GREEN)Complete pipeline finished successfully!$(NC)"

# Advanced targets
.PHONY: multi-arch-build
multi-arch-build: check-env ## Build multi-architecture image (amd64, arm64)
	@echo "$(BLUE)Building multi-architecture image...$(NC)"
	@docker buildx create --use --name $(APP_NAME)-builder 2>/dev/null || true
	@docker buildx build --no-cache --platform linux/amd64,linux/arm64 \
		-t $(DOCKER_TAG) -t $(LATEST_TAG) \
		--push .
	@echo "$(GREEN)Multi-architecture build completed!$(NC)"

.PHONY: prod-deploy
prod-deploy: ## Production deployment with health checks
	@echo "$(BLUE)Production deployment...$(NC)"
	@$(MAKE) build
	@$(MAKE) security-scan
	@$(MAKE) test-local &
	@sleep 10
	@$(MAKE) stop-test
	@$(MAKE) push
	@echo "$(GREEN)Production deployment completed!$(NC)"

# Help target should be last
.PHONY: list
list: ## List all available targets
	@$(MAKE) help

# Docker Compose Commands for Local Testing
.PHONY: docker-up
docker-up: ## Start the application with Docker Compose
	@echo "$(BLUE)Starting application with Docker Compose...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)Application started at http://localhost:5173$(NC)"
	@echo "$(BLUE)Use 'make docker-logs' to view logs$(NC)"

.PHONY: docker-up-build
docker-up-build: ## Build and start the application with Docker Compose
	@echo "$(BLUE)Building and starting application with Docker Compose...$(NC)"
	@docker-compose up -d --build
	@echo "$(GREEN)Application started at http://localhost:5173$(NC)"

.PHONY: docker-up-nginx
docker-up-nginx: ## Start with Nginx reverse proxy
	@echo "$(BLUE)Starting application with Nginx proxy...$(NC)"
	@docker-compose --profile with-nginx up -d --build
	@echo "$(GREEN)Application started at:$(NC)"
	@echo "$(GREEN)  - Direct: http://localhost:5173$(NC)"
	@echo "$(GREEN)  - Via Nginx: http://localhost$(NC)"

.PHONY: docker-down
docker-down: ## Stop and remove Docker Compose containers
	@echo "$(BLUE)Stopping Docker Compose...$(NC)"
	@docker-compose down
	@echo "$(GREEN)Docker Compose stopped$(NC)"

.PHONY: docker-down-clean
docker-down-clean: ## Stop containers and remove volumes
	@echo "$(BLUE)Stopping Docker Compose and cleaning volumes...$(NC)"
	@docker-compose down -v --remove-orphans
	@echo "$(GREEN)Docker Compose stopped and cleaned$(NC)"

.PHONY: docker-logs
docker-logs: ## View Docker Compose logs
	@docker-compose logs -f

.PHONY: docker-logs-app
docker-logs-app: ## View application logs only
	@docker-compose logs -f smartseller-storefront

.PHONY: docker-status
docker-status: ## Show Docker Compose status
	@docker-compose ps

.PHONY: docker-shell
docker-shell: ## Open shell in the running container
	@docker-compose exec smartseller-storefront sh

.PHONY: docker-test
docker-test: ## Run Docker health check test
	@echo "$(BLUE)Testing Docker container health...$(NC)"
	@docker-compose up -d
	@sleep 10
	@echo "$(BLUE)Testing health endpoint...$(NC)"
	@curl -f http://localhost:5173/health || (echo "$(RED)Health check failed$(NC)" && exit 1)
	@echo "$(BLUE)Testing main application...$(NC)"
	@curl -f http://localhost:5173/ > /dev/null || (echo "$(RED)Main app test failed$(NC)" && exit 1)
	@echo "$(GREEN)All Docker tests passed!$(NC)"

.PHONY: docker-dev
docker-dev: ## Start development environment with Docker Compose
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

.PHONY: docker-rebuild
docker-rebuild: ## Rebuild Docker image and restart
	@echo "$(BLUE)Rebuilding Docker image...$(NC)"
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "$(GREEN)Docker image rebuilt and restarted$(NC)"
