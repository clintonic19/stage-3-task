## System Architecture

## Authentication Flow
1. CLI generates state + PKCE (verifier + challenge)
2. Opens GitHub OAuth URL with code_challenge
3. Local HTTP server listens on :9876
4. Backend exchanges code → GitHub token → user upsert
5. Backend redirects with access_token + refresh_token
6. CLI stores in ~/.insighta/credentials.json

## Token Handling
- Access token: 3 min JWT, sent as Bearer header (CLI) / HTTP-only cookie (web)
- Refresh token: 5 min, rotated on every use, stored in MongoDB
- CLI auto-refreshes on 401, re-prompts login if refresh fails

## Role Enforcement
- admin: full CRUD on profiles
- analyst: read-only (GET endpoints only)
- Enforced via authorize() middleware factory on each route

## Natural Language Parsing
Regex-based NLP extracts gender, age, age_group, and country
from free-text queries. E.g. "young males from Nigeria" →
{ gender: "male", age_group: "teen", country_id: "NG" }

## CLI Usage
insighta login
insighta profiles list --gender female --country NG --page 2
insighta profiles search "adult males from ghana"
insighta profiles create --name "Ada Lovelace"
insighta profiles export --format csv --country NG