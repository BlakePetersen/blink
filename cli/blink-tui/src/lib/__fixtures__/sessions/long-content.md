---
title: "Comprehensive API Refactoring"
tags: [api, refactor, breaking-change, v2]
created: 2026-01-07T16:45:00Z
project: /Users/dev/api-server
type: saved
---

## Working On
Major refactoring of the REST API to follow consistent patterns. This includes standardizing error responses, implementing proper pagination, adding rate limiting, and restructuring endpoints to be more RESTful.

The scope includes:
- User management endpoints (/users, /users/:id, /users/:id/settings)
- Resource endpoints (/resources, /resources/:id, /resources/:id/versions)
- Search and filtering (/search, query parameters)
- Batch operations (/batch/*)
- Webhooks (/webhooks, /webhooks/:id/events)

## Status
Phase 1 (error standardization) complete. Phase 2 (pagination) in progress. Phases 3-5 not started.

## Key Decisions
- Error format: { "error": { "code": "ERR_XXX", "message": "Human readable", "details": {} } }
- Pagination: cursor-based for lists, offset for search
- Rate limiting: token bucket algorithm, 1000 req/hour default
- Versioning: URL path (/v2/) not headers
- Breaking changes documented in CHANGELOG.md

## Files Involved
- src/middleware/error-handler.ts
- src/middleware/pagination.ts
- src/middleware/rate-limiter.ts
- src/routes/v2/*.ts
- src/utils/response-formatter.ts
- tests/integration/api-v2/*.test.ts
- docs/api/v2/*.md

## Next Steps
1. Finish cursor pagination implementation
2. Add pagination to all list endpoints
3. Write migration guide for v1 -> v2
4. Update OpenAPI spec
5. Create deprecation notices for v1 endpoints
6. Set up v1 sunset timeline (6 months)

## Context
This is a breaking change. We're maintaining v1 for 6 months after v2 launch. Client libraries will need updates. SDKs for Python, Node, and Go are maintained by us. Community SDKs will need notification.

Additional context from standup: Product wants v2 ready by end of Q1. Marketing needs 2 weeks notice before announcement. Legal approved the deprecation timeline.
