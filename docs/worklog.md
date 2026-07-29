# 작업 기록

## [2026-07-29 10:41] Codex 리뷰 대응: .env 권한 차단 규칙 점검
- 변경 파일: .claude/settings.json, docs/decisions.md
- 지적 내용: "Bash(cat:*) allow 규칙이 Read(./.env) deny 규칙보다 먼저 매칭되어 cat .env 실행 시 차단이 실제로 작동하지 않는다"
- 검증 결과:
  - 공식 문서(permissions.md) 확인: 권한 규칙은 "deny → ask → allow" 순으로 평가되며, deny는 규칙 순서·구체성과 무관하게 항상 우선한다. 또한 Read/Edit deny 규칙은 Bash에서 인식되는 파일 읽기 명령(cat, head, tail, sed 등)에도 그대로 적용된다고 명시되어 있음.
  - → Codex가 지적한 "매칭 순서 때문에 차단이 안 된다"는 진단 자체는 근거가 없음(타당하지 않음). Bash(cat:*)가 allow에 있어도 Read(./.env) deny가 매칭되면 항상 차단됨.
  - 다만 실제 코드에서 deny 규칙이 `Read(./.env)`, `Read(./.env.*)` 형태로 `./` 접두사를 쓰고 있었는데, 문서가 명시하는 지원 앵커 형식(bare filename, `/path`, `//path`, `~/path`) 중 `./path`는 포함되어 있지 않아 실제 매칭 여부가 문서로 보장되지 않는 상태였음.
- 조치: deny 규칙을 문서가 명시적으로 보장하는 bare filename 형식 `Read(.env)`, `Read(.env.*)`로 수정. `jq .`로 JSON 문법 확인 완료(정상).
- 남은 이슈:
  - Read/Edit deny 규칙이 "인식하는" Bash 명령 목록은 문서상 cat/head/tail/sed 등으로 예시만 나열되어 있어 grep/awk/less/python -c 등 임의의 서브프로세스 파일 접근까지 확실히 차단되는지는 문서만으로 보장되지 않음. OS 수준으로 완전히 막으려면 sandbox 기능(sandbox.enabled + credentials.files deny)이 필요하며, 이는 새 의존성/구성 변경이라 사용자 확인 후 진행 필요.
  - 실제 .env 파일로 cat 차단 동작을 직접 재현 테스트하지는 않음(CLAUDE.md의 ".env 파일 읽기·수정·더미값 삽입 금지" 규칙 준수). 문서 근거로만 검증함.

## [2026-07-29 11:45] docs/architecture.md 초안 작성
- 변경 파일: docs/architecture.md(신규), docs/mockups/plan-20days.jpg·daily-schedule.jpg(신규 커밋), docs/decisions.md, docs/worklog.md
- 브랜치: docs/architecture (chore/agent-rules HEAD 8a6a361 기준)
- 작업 내용: 손으로 쓴 실물 2장을 읽어 설계 문서 초안 작성. 코드는 작성하지 않음.
- 사용자 확정 사항 3건(AskUserQuestion):
  - 배포/DB: 집 안 상시 구동 PC/NAS에서 next start, SQLite 파일 1개를 서버가 단독 소유 → 스택 고정 조건 유지하면서 다기기 공유 성립, 새 의존성 0개
  - 사용자 범위: 아이 1명, 인증 없음 → Child 테이블 없음
  - 밀린 숙제: 원래 날짜 유지 + 오늘 화면 상단 별도 섹션 노출 (이월 없음)
- 검증 결과:
  - CLAUDE.md 완료 조건 4종(lint / tsc --noEmit / test / build)은 **실행 불가**. package.json이 아직 없어 네 명령 모두 존재하지 않음. 이 사실을 architecture.md §7.3에 명기했고, 완료 조건은 첫 코드 커밋부터 적용한다.
  - 실물 이미지 역검증(문서가 실물의 모든 요소를 표현 가능한지):
    - 진도 전진(Big Note ch.6→ch.12, 13 Tree House ch.7→ch.13, Wimpy Kid ~p.102→~p.217) → progressStart 자동 채움 + progressEnd. 표현됨
    - 진도 단위 2종(챕터/페이지) → ProgressUnit enum. 표현됨
    - 빈 날짜 6일(8/3, 10, 14, 15, 16, 17) → 행이 없는 상태가 곧 미정. 표현됨
    - 한글책/영어책 혼재 → Book.language. 표현됨
    - reading project, work sheet, 일기 → PROJECT / WORKSHEET / DIARY. 표현됨
    - 12시간제 시각("2:00~3:00" = 오후) → Int 분(840~900)으로 정규화. 표현됨
    - 비학습 블록(아침식사, 점심&자유시간) → BlockCategory.ROUTINE. 표현됨
    - 시드 10개 블록 분 단위 변환 재확인: 450/480/600/660/690/750/765/840/900/1020 — 실물 시각과 일치
  - 요청 산출물 5개 모두 포함 확인: ERD(§1) / 유형 모델링 트레이드오프 3안 비교(§2) / 상태 전이 다이어그램 + 저장 vs 계산 비교(§3) / API 엔드포인트(§5) / 화면 목록(§6). 각 결정에 이유와 대안 비교 첨부.
- 남은 이슈:
  - 백업 전략 미정. SQLite 파일 하나에 방학 전체 계획이 들어있고 그 PC가 유일한 사본임. 최소 파일 복사 스크립트 필요.
  - 취침 시각 미정(실물 시간표가 17:00에서 끝남). 주말에도 같은 시간표가 적용되는지 미확인.
  - 새 의존성 4건(vitest / zod / 스타일 방식 / 스캐폴딩 옵션)은 CLAUDE.md 규칙에 따라 설치 직전 사용자 확인 필요. architecture.md §7.1에 목록화.
  - PR은 gh CLI 미설치로 자동 생성하지 못함. 브랜치 push 후 compare URL을 사용자에게 전달.
  - 이 브랜치는 chore/agent-rules에 스택되어 있음. chore/agent-rules가 먼저 머지되어야 함.
