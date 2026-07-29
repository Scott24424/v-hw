# 결정 기록

- [2026-07-29] .claude/settings.json의 deny 규칙을 `Read(./.env)` → `Read(.env)` (및 `.env.*` 동일)로 수정. 공식 문서(code.claude.com/docs/en/permissions) 기준 지원되는 앵커 형식은 bare filename / `/path` / `//path` / `~/path` 뿐이며 `./path`는 명시되어 있지 않아 매칭이 보장되지 않음. bare filename 형식은 `**/.env`와 동일하게 어떤 깊이에서도 매칭됨이 문서로 확인됨.
