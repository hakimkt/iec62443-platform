FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*
