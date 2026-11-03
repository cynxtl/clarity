import base64
from pathlib import Path

# Minimal 1x1 transparent PNG binary
SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

SAMPLE_DOCS_CONTENT = {
    "README.md": """# Nexus Cloud Developer Platform

Welcome to the official developer documentation for the Nexus Cloud platform. Nexus provides high-throughput event processing, microservice orchestrations, and distributed configuration management.

## Prerequisites

Before deploying or developing on Nexus, ensure you have:
- Node.js 20+ or Python 3.11+
- An active Nexus developer account
- A valid project workspace ID

## Installation

Install the Nexus CLI toolchain using your preferred package manager:

```bash
npm install -g @nexus/cli
# or via homebrew
brew install nexus-cloud/tap/nexus
```

## Documentation Structure

- [Getting Started Guide](./docs/getting-started/quickstart.md)
- [Authentication & API Keys](./docs/getting-started/authentication.md)
- [API Reference](./docs/api/overview.md)
- [Deployment Topologies](./docs/guides/deployment.md)
- [Architecture Concepts](./docs/architecture/concepts.md)
""",

    "docs/getting-started/quickstart.md": """# Quickstart Guide

This guide will walk you through provisioning your first Nexus cloud worker and dispatching your first asynchronous task.

## Prerequisites

Ensure you have initialized the Nexus CLI and authenticated your terminal session.

```bash
nexus auth login
nexus workspace select prod-eu-1
```

## Installation

Initialize a new micro-service project template:

```bash
nexus init my-worker --template typescript-starter
cd my-worker
npm install
```

## Launching the Worker

Run the local test harness to verify worker responsiveness:

```bash
npm run dev
```

Inspect worker telemetry at `http://localhost:8080/metrics`.
""",

    "docs/getting-started/authentication.md": """# Authentication & Security

Nexus services authenticate all inbound HTTP and gRPC traffic using cryptographic bearer tokens.

### Security Tokens

When dispatching requests, provide your API key in the `Authorization` header:

```
curl -H "Authorization: Bearer nex_live_839fjs9283" https://api.nexus.cloud/v1/projects
```

## Network Access and Whitelist

To ensure security across corporate firewalls, you can configure an IP whitelist for your enterprise cluster. Requests coming from unapproved CIDR blocks will be rejected with HTTP 403 Forbidden.

![Cluster networking topology](./assets/architecture.png)

![](./assets/missing-security-diagram.png)

Please contact security operations if you require dedicated VPC peering on-premise.
""",

    "docs/api/overview.md": """# Nexus REST API Overview

The Nexus REST API conforms to OpenAPI 3.1 specifications and provides programmatic control over cluster workloads, autoscaling policies, and tenant budgets.

## Base URL

All requests must be directed to:
`https://api.nexus.cloud/v1`

## Core Concepts

For an overview of tenant isolation, refer to [Architecture Concepts](../architecture/concepts.md).

For throughput caps and quota policies, check out our [Rate Limiting Guide](./rate-limiting.md).

## Workflow Pipeline

See the high-level request lifecycle below:

![API Request Lifecycle](./assets/api-flow.png)
""",

    "docs/api/endpoints.md": """# API Endpoints Specification

This document details the public REST endpoints for the cluster control plane.

## Service Clusters

List all active compute nodes within the target region.

```http
GET /v1/clusters
```

## Error Codes

The API returns standard RFC 7807 problem details when an error occurs during processing.

## Error Codes

Common error status codes include `RESOURCE_EXHAUSTED`, `DEADLINE_EXCEEDED`, and `UNAUTHENTICATED`.

### Response Payload

```json
{
  "code": 404,
  "message": "Cluster 'cluster-west' not found."
}
```
""",

    "docs/guides/deployment.md": """# Production Deployment Guide

Deploying Nexus workloads to production environments requires understanding our high-availability multi-region active-active topology and consensus mechanisms.

## Prerequisites

You must have administrative permissions in the target organization.

## Multi-Region Clusters

Nexus instances coordinate state across regions using an optimized consensus protocol that delivers low-latency replication while maintaining strict linearizability for state transitions. When orchestrating failovers between primary and backup zones, the control plane automatically rebalances partition leases across all available healthy nodes, preventing split-brain conditions even during severe transatlantic undersea cable degradations or transient fiber cuts, while simultaneously notifying downstream consumers of updated leader lease terms through our distributed gossip mesh without dropping any inflight client sessions or corrupting persistent volume storage mounts across the fleet.

## Observability

Monitor real-time latency with standard Prometheus metrics:

```bash
curl http://localhost:9090/federate
```
""",

    "docs/architecture/concepts.md": """# Architecture Concepts

Nexus is designed around distributed actors that communicate over asynchronous memory-mapped channels.

## Execution Model

Each worker maintains an isolated execution sandbox powered by WebAssembly. State mutations are committed to an append-only transaction log.

## Isolation Guarantees

Tenants execute inside lightweight, hardware-isolated microVMs with sub-millisecond cold start characteristics.
"""
}

def generate_sample_repository(target_dir: Path):
    """
    Creates a rich, realistic sample documentation repository.
    Includes both compliant files and realistic issues for demonstration.
    """
    target_dir.mkdir(parents=True, exist_ok=True)

    for rel_path, content in SAMPLE_DOCS_CONTENT.items():
        file_path = target_dir / rel_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")

    # Write sample asset image
    asset_path = target_dir / "docs/getting-started/assets/architecture.png"
    asset_path.parent.mkdir(parents=True, exist_ok=True)
    asset_path.write_bytes(base64.b64decode(SAMPLE_PNG_BASE64))
