.PHONY: up down restart logs build db-push db-studio backend-shell

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

build:
	docker compose up -d --build

logs:
	docker compose logs -f

db-push:
	docker compose exec backend bun run db:push

db-studio:
	@echo "Starting Drizzle Studio..."
	docker compose exec backend bun x drizzle-kit studio

backend-shell:
	docker compose exec backend /bin/sh

frontend-build:
	docker compose up -d --build frontend

tag-version:
	@read -p "Enter version tag (e.g., v1.0): " version; \
	docker tag elysia-dashboard-backend elysia-dashboard-backend:$$version; \
	docker tag elysia-dashboard-frontend elysia-dashboard-frontend:$$version; \
	echo "✅ Tagged images with $$version"
