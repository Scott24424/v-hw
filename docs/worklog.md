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

## [2026-07-29 13:21] Stage 1 스캐폴딩
- 변경 파일: package.json(신규), package-lock.json(신규), tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs(모두 신규, create-next-app 생성), app/(레이아웃·기본 페이지), public/(기본 아이콘), prisma/schema.prisma(신규, 모델 없음), vitest.config.ts, playwright.config.ts, tests/smoke.test.ts, e2e/smoke.spec.ts, scripts/backup.mjs, .gitignore, docs/decisions.md(4건 추가)
- 브랜치: chore/scaffold (docs/architecture 기준, 아직 push 안 함 — 사용자 승인 후 진행)
- 작업 내용:
  - `npx create-next-app@latest`를 리포 바깥 스크래치 디렉터리에서 실행한 뒤 생성 파일만 리포로 병합. 리포 루트에서 직접 실행하면 create-next-app이 `.claude/`·`CLAUDE.md`·`AGENTS.md`를 "충돌 파일"로 인식해 중단되므로 우회.
  - 옵션: TypeScript, App Router, Tailwind CSS, ESLint, import alias `@/*`, `--disable-git`(기존 저장소 git 재초기화 방지), `--no-agents-md`(기존 AGENTS.md 심볼릭 링크와 충돌 방지)
  - `package.json` name을 `v-hw-scaffold` → `v-hw`로 수정, CLAUDE.md 완료 조건에 맞춰 `lint`/`typecheck`(`tsc --noEmit`)/`test`(`vitest run`)/`test:e2e`(`playwright test`)/`backup` 스크립트 추가
  - Prisma: `@prisma/client` + `prisma` 설치, `prisma/schema.prisma`는 datasource/generator만 정의(모델 없음). datasource url은 `env("DATABASE_URL")`이 아니라 `"file:./dev.db"` 리터럴 — 이유는 decisions.md 참조(.env 파일을 만들 수 없어서 + 배포 환경이 하나뿐이라 손실 없음)
  - vitest(environment: node) + Playwright(chromium 바이너리 설치 포함) 기본 설정과 스모크 테스트 각 1개
  - `.gitignore`에 Next.js 표준 항목, `prisma/dev.db*`, `backups/`, 테스트 아티팩트(`coverage`, `test-results`, `playwright-report`) 추가
- 각 패키지가 필요한 이유:
  - `next` `react` `react-dom` — 고정 스택(App Router)의 런타임 자체
  - `@prisma/client` — 앱 코드에서 DB를 타입 안전하게 쿼리하는 런타임 클라이언트
  - `prisma`(devDependency) — 스키마 검증·마이그레이션·클라이언트 생성을 수행하는 CLI
  - `typescript` `@types/*` — CLAUDE.md의 "any 타입 금지"를 도구 차원에서 강제하려면 타입 정보 자체가 있어야 함
  - `eslint` `eslint-config-next` — `npm run lint` 무경고가 완료 조건이라 린터가 있어야 그 기준을 검사할 수 있음
  - `tailwindcss` `@tailwindcss/postcss` — create-next-app 선택 스타일 방식(사용자 확정)
  - `vitest` — `npm run test`가 완료 조건인데 러너가 없었음(사용자 지정)
  - `@playwright/test` — E2E 테스트 러너(사용자 지정), 브라우저 바이너리(chromium)도 별도 설치 필요
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm install` — 1차 시도 `ECONNRESET`(Prisma 엔진 바이너리 다운로드 중 네트워크 끊김)로 실패, 재시도 시 exit 0 성공. 일시적 네트워크 문제로 판단(재시도만으로 해결, 코드/설정 문제 아님)
  - `npx prisma generate` — "Generated Prisma Client (v6.19.3)" 성공, 모델이 없어도 정상 동작
  - `npm run test` → `vitest run`: `tests/smoke.test.ts (1 test)` 통과. `Test Files 1 passed (1)`
  - `npm run lint` → `eslint`: 출력 없음(무경고)
  - `npm run typecheck` → `tsc --noEmit`: 출력 없음(에러 0)
  - `npm run build` → `next build`: "Compiled successfully in 4.0s", "Finished TypeScript in 718ms", 4개 라우트 모두 정적 생성 성공
  - `npm run dev` 실제 구동 후 확인: 로그에 `✓ Ready in 125ms` 확인. `curl`이 `.claude/settings.json` deny 규칙(`Bash(curl:*)`)로 차단되어, 대신 `npx playwright test`로 헤드리스 브라우저가 실제 `http://localhost:3000/`에 접속해 기본 페이지 텍스트("To get started, edit the page.tsx file.")가 보이는지 확인 — `1 passed (5.4s)`. 확인 후 dev 서버 프로세스 종료.
- 남은 이슈:
  - `npm audit`: "12 high severity vulnerabilities" 보고됨(create-next-app 표준 산출물의 통상적인 개발 의존성 경고로 추정). 이번 작업 범위 밖이라 조치하지 않음 — 별도로 검토 필요.
  - `next-env.d.ts`는 `.gitignore`에 이미 있고(Next 표준) `npm run dev`/`build` 실행 시 자동 생성됨 — 리포에 커밋하지 않음.
  - Prisma 모델(architecture.md §1)은 다음 기능 커밋에서 추가 예정. 지금은 datasource/generator만 존재.
  - push는 사용자 승인 대기 중.

## [2026-07-29 13:35] Prisma 모델 정의 + 첫 마이그레이션
- 변경 파일: prisma/schema.prisma, prisma/migrations/20260729053325_init/migration.sql(신규), prisma/migrations/migration_lock.toml(신규)
- 브랜치: feature/prisma-schema (chore/scaffold 기준, 아직 push 안 함)
- 작업 내용: docs/architecture.md §1.5에 이미 확정된 스키마(Book / RoutineBlock / Assignment, enum 5종)를 그대로 옮기고 `npx prisma migrate dev --name init` 실행. 설계 문서와 1:1 대응이라 별도 설계 판단 없음.
- 검증 결과:
  - `npx prisma validate` — "The schema at prisma/schema.prisma is valid"
  - `npx prisma migrate dev --name init` — "Your database is now in sync with your schema." SQLite `prisma/dev.db` 생성, `prisma/migrations/20260729053325_init/migration.sql` 생성. 생성된 SQL의 FK·인덱스·유니크 제약을 육안 대조 — architecture.md §1.5와 일치(Assignment_date_idx, Assignment_status_date_idx, Book_title_language_key 등)
  - `npm run lint` — 출력 없음(무경고)
  - `npm run typecheck` — 출력 없음(에러 0)
  - `npm run test` — `tests/smoke.test.ts (1 test)` 통과
  - `npm run build` — "Compiled successfully in 3.8s", 4개 라우트 정적 생성 성공
- 남은 이슈:
  - `prisma/dev.db`는 `.gitignore`(prisma/dev.db*)로 커밋 대상에서 제외됨 — 의도된 동작(런타임 데이터, decisions.md 백업 결정 참조)
  - 이번 커밋은 스키마·마이그레이션만 포함. §5의 API 라우트(zod 검증 포함)는 다음 기능 단위로 별도 커밋.
  - push는 사용자 승인 대기 중.

## [2026-07-29 15:53] PR #1~#6 머지 및 사고 복구, main 재검증
- 브랜치: main (모두 머지 완료)
- 작업 내용:
  - `gh` CLI 설치·인증 후 스택된 4개 브랜치(chore/agent-rules, docs/architecture, chore/scaffold, feature/prisma-schema)에 대해 PR #1~#4 생성
  - PR #1(chore/agent-rules → main) 머지 + `--delete-branch`. 이로 인해 PR #2(base=chore/agent-rules)가 GitHub에 의해 **자동으로 닫힘**(retarget 아님) — head 브랜치 삭제 시 그걸 base로 쓰는 다음 PR이 재조정되지 않고 closed 되며 reopen도 base 브랜치 부재로 불가능함을 확인. PR #5(docs/architecture → main)로 재생성해 대체
  - PR #5, #3(chore/scaffold → docs/architecture), #4(feature/prisma-schema → chore/scaffold, `--delete-branch`) 순서로 머지 완료
  - **사고**: PR #3·#4의 base가 각각 `docs/architecture`/`chore/scaffold`였다는 것은 "그 브랜치로 병합"이지 "main으로 병합"이 아니었음. 즉 실제로 main에 반영된 건 PR #1·#5뿐이었는데, 두 브랜치를 "이미 다 머지됐다"고 오판해 `git branch -d`로 로컬·원격에서 삭제함. `-d` 실행 시 "merged to origin/chore/scaffold, but not yet merged to HEAD" 경고가 떴으나 확인 없이 진행 — main 기준 미병합 상태였음을 놓침
  - **복구**: 삭제된 브랜치의 마지막 커밋(`3a0cbce`, scaffold+Prisma 모델 전부 포함)이 로컬 git 객체로 남아있음을 `git cat-file -e`로 확인(데이터 손실 없음). `git merge-tree`로 main과의 충돌 여부 사전 확인(충돌 없음) 후 `chore/land-scaffold-and-prisma` 브랜치를 그 커밋에서 생성, PR #6(base=main)으로 재제출해 정상 머지
- 검증 결과 (main 병합 완료 후 실제 재실행):
  - `git pull origin main` — fast-forward, 26개 파일 반영 확인. (직전 `npm install` 잔여물인 빈 package-lock.json 스텁과 `prisma/dev.db`가 untracked로 남아 pull을 막아 삭제 후 재시도 — 둘 다 재생성 가능한 로컬 산출물이라 데이터 아님)
  - `npm install` — exit 0
  - `npx prisma migrate deploy` — "All migrations have been successfully applied."
  - `npm run lint` — 출력 없음(무경고)
  - `npm run typecheck` — 출력 없음(에러 0)
  - `npm run test` — `tests/smoke.test.ts (1 test)` 통과
  - `npm run build` — "Compiled successfully in 2.4s", 4개 라우트 정적 생성 성공
  - `npm run dev` 실제 구동(`✓ Ready in 123ms`) 후 `npx playwright test`로 실제 브라우저 접속 확인 — `1 passed`. 확인 후 dev 서버 종료
- 남은 이슈:
  - PR #2는 CLOSED 상태로 GitHub에 남음(#5로 대체, 정리 목적의 삭제는 하지 않음 — 이력 보존)
  - 앞으로 스택 PR을 만들 때는 각 PR의 base를 직전 브랜치가 아니라 **가능하면 main으로 직접** 잡거나, base가 다른 PR의 head인 경우 그 사실을 명확히 인지하고 "머지 완료 = main 반영 완료"로 착각하지 않아야 함. `git branch -d` 경고 문구는 무시하지 않고 반드시 `git branch --merged main`으로 재확인 후 삭제할 것.

## [2026-07-29 16:25] /api/assignments 라우트 구현 (GET+POST)
- 변경 파일: lib/prisma.ts(신규), lib/date.ts(신규), lib/assignments/schema.ts(신규), lib/assignments/serialize.ts(신규), app/api/assignments/route.ts(신규), tests/date.test.ts(신규), tests/assignments-schema.test.ts(신규), e2e/assignments-api.spec.ts(신규), vitest.config.ts(alias 추가), package.json/package-lock.json(zod 추가), docs/decisions.md(5건 추가)
- 브랜치: feature/api-assignments (main 기준, 아직 push 안 함)
- 작업 내용: architecture.md §5의 `/api/assignments` 엔드포인트(범위 조회 GET, 생성 POST) 구현
  - `lib/prisma.ts` — Next.js HMR 환경에서 PrismaClient 중복 생성을 막는 표준 싱글턴 패턴
  - `lib/date.ts` — `isValidDateString`(형식+달력 유효성), `todayKST`(서버 Asia/Seoul 기준 오늘, decisions.md #7 근거), `isOverdue`(§3.2 계산식)
  - `lib/assignments/schema.ts` — zod `superRefine`으로 §2.2 유형별 필드 규칙(READING만 bookId/progressUnit/progressEnd 필수, 그 외 전부 null, progressStart ≤ progressEnd) 강제
  - `app/api/assignments/route.ts` — GET은 from/to/status/type 필터 + 응답마다 `isOverdue` 파생 필드 포함(§5.2 공통 규약). POST는 READING 유형일 때 progressStart 미지정 시 같은 책의 직전 progressEnd+1로 자동 채움(§1.4), 잘못된 bookId/routineBlockId 참조는 Prisma P2003을 잡아 400으로 변환
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run test`(vitest) — `tests/date.test.ts`(7) + `tests/assignments-schema.test.ts`(10) + 기존 스모크(1) = 18개 전부 통과. 정상 케이스와 규칙 위반 케이스(READING인데 bookId 없음, READING 아닌데 bookId 지정, progressStart>progressEnd, 잘못된 날짜 형식, 빈 제목) 모두 포함
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 5개 전부 통과: progressStart 자동 이어붙임(ch.6→ch.12 시나리오로 재현) / 잘못된 bookId 400 / 규칙 위반 페이로드 400 / 목록 조회에 isOverdue 포함
  - 중간에 `vitest`가 `@/lib/...` import를 못 찾는 실패 발생 → 원인: `tsconfig.json`의 `paths`는 vitest(Vite)가 자동으로 읽지 않음 → `vitest.config.ts`에 `resolve.alias` 추가로 해결, 재실행해 18개 통과 확인
  - 중간에 Playwright e2e 4개가 `Unique constraint failed on (title, language)`로 실패 → 원인 가설 1개로 확인: `beforeAll`이 병렬 워커마다 한 번씩 실행되어 같은 제목의 Book을 동시에 생성 시도 → `test.describe.configure({ mode: "serial" })`로 파일 전체를 한 워커에서 순차 실행하도록 수정, 재실행해 5개 전부 통과 확인
  - `npm run lint` / `npm run typecheck` — 출력 없음(무경고/에러 0)
  - `npm run build` — "Compiled successfully in 2.3s", `/api/assignments`가 Dynamic(ƒ) 라우트로 정상 등록됨
- 남은 이슈:
  - `/api/books`, `/api/routine-blocks`가 아직 없어 e2e 테스트가 Book 시드를 API가 아니라 Prisma 클라이언트로 직접 생성함 — 다음 기능(§5의 나머지 엔드포인트) 구현 시 자연히 해소됨
  - `PATCH`/`DELETE /api/assignments/:id`, `PATCH /:id/status`, `/api/summary/remaining`, `/api/days/:date`는 architecture.md §5에 명시된 대로 다음 기능 단위로 별도 구현
  - push는 사용자 승인 대기 중.

## [2026-07-29 16:53] /api/books 라우트 구현 (GET+POST+PATCH)
- 변경 파일: lib/books/schema.ts(신규), app/api/books/route.ts(신규), app/api/books/[id]/route.ts(신규), tests/books-schema.test.ts(신규), e2e/books-api.spec.ts(신규), e2e/assignments-api.spec.ts(책 시드를 POST /api/books 호출로 교체), docs/decisions.md(4건 추가)
- 브랜치: feature/api-books (main 기준, 아직 push 안 함)
- 작업 내용: architecture.md §5의 `/api/books`(GET 목록·POST 등록), `/api/books/:id`(PATCH 수정) 구현. 명세에 없는 DELETE/단건 GET은 추가하지 않음(범위 그대로)
  - `lib/books/schema.ts` — `createBookSchema`(title/language 필수, totalChapters/totalPages 선택), `updateBookSchema`(전부 선택이지만 빈 객체는 refine으로 거부, null은 "값 지우기"로 허용)
  - `app/api/books/route.ts` — POST에서 (title, language) unique 위반(Prisma P2002)을 409로 변환
  - `app/api/books/[id]/route.ts` — Next 16 App Router의 비동기 `params`(`Promise<{ id: string }>`) 사용, 존재하지 않는 id(P2025)는 404, 중복(P2002)은 409
  - `e2e/assignments-api.spec.ts`의 `beforeAll`을 `prisma.book.create` 직접 호출에서 `request.post("/api/books", ...)`로 교체 — 지난 작업에서 남긴 이슈 해소
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run build` 도중 Next의 라우트 타입 생성 단계("Running TypeScript ...")로 `app/api/books/[id]/route.ts`의 동적 라우트 핸들러 시그니처(`params: Promise<{ id: string }>`)가 Next 16 기준으로 올바른지 확인 — 에러 없이 통과, `/api/books/[id]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npm run test`(vitest) — 신규 `tests/books-schema.test.ts`(10) 포함 총 28개 전부 통과. 정상 케이스와 규칙 위반 케이스(title 없음/빈 문자열, language가 EN/KO 아님, totalChapters ≤ 0, 빈 PATCH 객체) 모두 포함
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — books 5개 + 기존 assignments 4개(책 시드 방식이 바뀐 채로) + smoke 1개, 총 10개 전부 통과: 등록→목록 반영, 중복 409, 필수 필드 누락 400, 부분 수정, 존재하지 않는 id 404
  - `npm run lint` / `npm run typecheck` — 출력 없음(무경고/에러 0)
- 남은 이슈:
  - `/api/routine-blocks`(GET/POST/PATCH/DELETE)는 아직 없음 — 다음 기능 단위
  - `PATCH`/`DELETE /api/assignments/:id`, `PATCH /:id/status`, `/api/summary/remaining`, `/api/days/:date`도 architecture.md §5에 명시된 대로 이후 별도 구현
  - push는 사용자 승인 대기 중.

## [2026-07-29 18:12] /api/routine-blocks 라우트 구현 (GET+POST, PATCH+DELETE)
- 변경 파일: lib/routine-blocks/schema.ts(신규), app/api/routine-blocks/route.ts(신규), app/api/routine-blocks/[id]/route.ts(신규), tests/routine-blocks-schema.test.ts(신규), e2e/routine-blocks-api.spec.ts(신규), docs/decisions.md(4건 추가)
- 브랜치: feature/api-routine-blocks (origin/main 최신 기준, 아직 push 안 함)
- 작업 내용: architecture.md §5의 `/api/routine-blocks`(GET 목록·POST 등록), `/api/routine-blocks/:id`(PATCH 수정·DELETE 삭제) 구현
  - `lib/routine-blocks/schema.ts` — `createRoutineBlockSchema`(startMinute/endMinute/label 필수, category/sortOrder/isActive 선택, `startMinute < endMinute` refine), `updateRoutineBlockSchema`(전부 선택, 빈 객체 거부, 두 필드가 함께 있을 때만 순서 재검증)
  - `app/api/routine-blocks/route.ts` — GET은 `sortOrder` → `startMinute` 순 전체 목록(필터 없음, 근거는 decisions.md)
  - `app/api/routine-blocks/[id]/route.ts` — PATCH는 존재하지 않는 id(P2025) 404, DELETE는 성공 시 204, 존재하지 않으면 404. 연결된 Assignment.routineBlockId는 마이그레이션의 `ON DELETE SET NULL`이 자동 처리
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 출력 없음(에러 0)
  - `npm run test`(vitest) — 신규 `tests/routine-blocks-schema.test.ts`(11) 포함 총 39개 전부 통과. 정상 케이스와 규칙 위반 케이스(label 빈 문자열, startMinute≥endMinute, 범위(0~1439) 벗어남, category 잘못된 값, 빈 PATCH 객체, isActive 타입 오류) 모두 포함
  - `npm run build` — 성공, `/api/routine-blocks`와 `/api/routine-blocks/[id]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — routine-blocks 6개 + 기존 books 5개 + assignments 4개 + smoke 1개, 총 16개 전부 통과: 등록→목록 반영(기본값 category=STUDY/isActive=true 확인), 순서 역전 400, 부분 수정, 존재하지 않는 id PATCH 404, 삭제 후 목록에서 사라짐, 존재하지 않는 id DELETE 404
- 남은 이슈:
  - `updateRoutineBlockSchema`는 startMinute·endMinute 중 한쪽만 부분 수정할 때 기존 저장값과의 순서를 검증하지 않음(decisions.md에 근거 기록) — 편도 수정으로 역전 구간이 저장될 수 있음
  - `PATCH`/`DELETE /api/assignments/:id`, `PATCH /:id/status`, `/api/summary/remaining`, `/api/days/:date`는 architecture.md §5에 명시된 대로 다음 기능 단위로 별도 구현
  - push는 사용자 승인 대기 중.

## [2026-07-29 22:12] /api/assignments/:id 라우트 구현 (PATCH+DELETE, PATCH .../status)
- 변경 파일: lib/assignments/schema.ts(updateAssignmentSchema, updateAssignmentStatusSchema 추가), lib/assignments/status.ts(신규), app/api/assignments/[id]/route.ts(신규), app/api/assignments/[id]/status/route.ts(신규), tests/assignments-schema.test.ts(신규 케이스 추가), e2e/assignments-detail-api.spec.ts(신규), e2e/assignments-api.spec.ts(afterAll 정리 로직을 id 추적 방식으로 교체 — 버그 수정), docs/decisions.md(5건 추가)
- 브랜치: feature/api-assignment-detail (origin/main 최신 기준, 아직 push 안 함)
- 작업 내용: 사용자가 지정한 범위(PATCH/DELETE/status)만 구현. architecture.md §5의 `GET /api/assignments/:id`(단건 조회)는 이번 범위 밖 — 남은 이슈로 기록(근거는 decisions.md)
  - `PATCH /api/assignments/:id` — 날짜·제목·note·진도·블록 연결·정렬 수정. `type`/`status`는 대상 아님. 기존 레코드를 `findUnique`로 먼저 조회해 §2.2 유형별 필드 규칙(READING 아니면 진도/책 필드 거부, READING이면 병합된 progressStart/progressEnd 순서 검증)을 라우트에서 검증. FK 위반(P2003)은 400, 존재하지 않는 id는 404
  - `DELETE /api/assignments/:id` — 물리 삭제(§5.1), 성공 204, 존재하지 않으면 404
  - `PATCH /api/assignments/:id/status` — `lib/assignments/status.ts`에 §3.1 전이 표를 그대로 코드화. 허용되지 않은 전이(동일 상태 포함)는 409, 존재하지 않는 id는 404, status 외 필드가 섞이면(.strict()) 400. DONE 진입 시 completedAt 기록, DONE 이탈 시 null로 복귀
- 버그 발견 및 수정: 새 e2e 파일 추가 중 `npx playwright test` 전체 실행에서 간헐적 실패(400 기대인데 404) 발견 → 원인 조사 결과 `e2e/assignments-api.spec.ts`의 `afterAll`이 `title: { contains: "e2e" }`로 광범위하게 지우고 있었는데, `fullyParallel: true`라 이 신규 파일과 동시에 실행되며 아직 테스트 중인 다른 파일의 assignment까지 삭제해 발생. id 추적 방식으로 교체해 해결(재발 방지 근거는 decisions.md)
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 출력 없음(에러 0)
  - `npm run test`(vitest) — `tests/assignments-schema.test.ts`가 10→24개로 확장(update 스키마 8개, status 스키마 3개, 전이 함수 3개 추가), 총 53개 전부 통과
  - `npm run build` — 성공, `/api/assignments/[id]`·`/api/assignments/[id]/status`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test` — assignments-detail 15개 + 기존 assignments 4개 + books 5개 + routine-blocks 6개 + smoke 1개, 총 29개 전부 통과(위 버그 수정 후 재현 없음 확인)
- 남은 이슈:
  - `GET /api/assignments/:id`(단건 조회), `/api/summary/remaining`, `/api/days/:date`는 architecture.md §5에 명시된 대로 다음 기능 단위로 별도 구현
  - push는 사용자 승인 대기 중.

## [2026-07-30 07:45] GET /api/assignments/:id 단건 조회 구현
- 변경 파일: app/api/assignments/[id]/route.ts(GET 추가), e2e/assignments-detail-api.spec.ts(2건 추가), docs/decisions.md(1건 추가)
- 브랜치: feature/api-assignment-get-by-id, **base는 main이 아니라 origin/feature/api-assignment-detail(PR #11, 아직 미머지)** — 같은 파일(`app/api/assignments/[id]/route.ts`)에 PATCH/DELETE가 이미 있어 main 기준으로 만들면 파일 자체가 충돌 확정이라 스택 브랜치로 감. PR base도 동일하게 feature/api-assignment-detail로 잡을 것.
- 작업 내용: architecture.md §5 `GET /api/assignments/:id`(단건 조회) 구현. PR #11이 명시적으로 범위 밖으로 남긴 이슈를 해소
  - 기존 PATCH/DELETE와 동일한 `parseId` 헬퍼 재사용, 존재하지 않으면 404, 응답은 `serializeAssignment`로 `isOverdue` 포함(§5.2 공통 규약)
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 출력 없음(에러 0)
  - `npm run test`(vitest) — 기존 53개 전부 통과(이번 변경은 스키마 추가가 없어 신규 단위 테스트 없음)
  - `npm run build` — 성공, `/api/assignments/[id]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 31개 전부 통과(신규 GET 테스트 2개: 정상 조회+isOverdue 포함 확인, 존재하지 않는 id 404)
- 남은 이슈:
  - `/api/summary/remaining`, `/api/days/:date`는 architecture.md §5에 명시된 대로 다음 기능 단위로 별도 구현
  - PR #11과 이 브랜치 모두 아직 미머지 — PR #11이 먼저 머지되면 이 브랜치는 rebase 필요
  - push는 사용자 승인 대기 중.

**추기(2026-07-30, 사고 복구)**: 이 커밋(PR #12)은 위 계획대로 `feature/api-assignment-detail`을 base로 병합됐지만, PR #11이 먼저 main에 머지된 뒤 이 PR의 base를 main으로 재설정하지 않아 **실제로는 main에 한 번도 반영되지 않았다** — "MERGED" 상태만 보고 main 반영을 확인하지 않은 것이 원인. PR #13~#17이 이 사실을 모른 채 진행됐고, UI 작업(`feature/ui-today-screen`) 중 `GET /api/assignments/:id` e2e 테스트가 빈 응답으로 실패하면서 발견됨. 복구는 아래 "fix: GET 라우트 유실 복구" 항목 참고.

## [2026-07-30 07:56] /api/summary/remaining 구현
- 변경 파일: app/api/summary/remaining/route.ts(신규), lib/date.ts(weekRangeKST 추가, OVERDUE_STATUSES export), tests/date.test.ts(weekRangeKST 5건 추가), e2e/summary-remaining-api.spec.ts(신규), docs/decisions.md(3건 추가)
- 브랜치: feature/api-summary-remaining (main 기준, 아직 push 안 함)
- 작업 내용: architecture.md §5의 `GET /api/summary/remaining`(`{ overdue[], today[], thisWeek[], counts }`) 구현
  - "이번 주" 경계가 설계 문서에 없어 사용자에게 질문 → 달력 주(월~일, KST)로 확정받음(decisions.md)
  - `lib/date.ts`에 `weekRangeKST(date?)` 추가 — 순수 함수, KST 기준 해당 날짜가 속한 주의 월요일/일요일을 반환. 연도 경계도 검증
  - 세 버킷은 날짜 구간만 다르고 상태 조건(`PLANNED`/`IN_PROGRESS`)은 동일 — `isOverdue`가 쓰는 `OVERDUE_STATUSES`를 그대로 export해 재사용
  - `counts`는 각 배열 길이를 그대로 담음
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 최초 시도에서 Prisma `orderBy`/`status.in`이 mutable 배열 타입을 요구해 `readonly` 배열(export한 `OVERDUE_STATUSES`, `as const` 배열)을 못 받는 에러 발생 → `REMAINING_STATUSES`로 스프레드 복사, `orderBy` 배열은 `as const`를 개별 필드에만 적용하는 방식으로 수정, 재실행해 에러 0 확인
  - `npm run test`(vitest) — 신규 `weekRangeKST` 5개 포함 총 58개 전부 통과. 주 중간/월요일 경계/일요일 경계/연도 경계/인자 생략 케이스 모두 포함
  - `npm run build` — 성공, `/api/summary/remaining`이 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 32개 전부 통과. 신규 3개: (1) 밀린 것/오늘 버킷 배타성 + 다음 주 항목 배제 + counts 일치 (2) 이번 주 경계(오늘+1~이번 주 일요일) 포함 확인 — 오늘이 일요일이면 자동 skip(사유는 decisions.md) (3) DONE/SKIPPED 상태는 어느 버킷에도 없음
- 남은 이슈:
  - `GET /api/days/:date`는 architecture.md §5에 명시된 대로 다음 기능 단위로 별도 구현
  - push는 사용자 승인 대기 중이 아니라 CLAUDE.md "작업 브랜치에는 자유롭게 push" 규칙에 따라 이어서 push+PR 진행 예정

## [2026-07-30 08:25] GET /api/days/:date 구현
- 변경 파일: app/api/days/[date]/route.ts(신규), lib/days/view.ts(신규, buildDayView 순수 함수), tests/days-view.test.ts(신규), e2e/days-api.spec.ts(신규), docs/decisions.md(2건 추가)
- 브랜치: feature/api-days (main 기준, 아직 push 안 함)
- 작업 내용: architecture.md §5의 마지막 남은 endpoint `GET /api/days/:date`(그날 시간표 블록 + 연결된 과제 + 미연결 과제) 구현. §5의 다른 endpoint와 달리 JSON 스키마가 문서에 명시돼 있지 않아 §4.1/§5.1/§6.3 근거로 직접 설계(decisions.md)
  - `lib/days/view.ts`의 `buildDayView(date, blocks, assignments)` — DB 조회와 분리된 순수 함수. 블록별 그룹화 로직을 단위 테스트로 커버(route handler 자체는 기존 관행대로 e2e로 검증)
  - 비활성화된 블록에 연결된 과제가 응답에서 통째로 사라지는 결함을 설계 중 발견 → 그런 과제도 `unlinkedAssignments`로 떨어지도록 방어 처리(decisions.md)
  - 날짜 형식 검증은 기존 `isValidDateString` 재사용, 잘못된 형식은 400(§5.2)
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 출력 없음(에러 0)
  - `npm run test`(vitest) — 신규 `days-view.test.ts` 6개 포함 총 64개 전부 통과. 정상 연결/미연결(null)/미연결(비활성 블록 참조)/빈 블록/같은 블록 다중 과제 순서 보존/date 필드 포함 케이스 모두 포함
  - `npm run build` — 성공, `/api/days/[date]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 36개 전부 통과. 신규 4개: 잘못된 날짜 400 / 활성 블록 연결+미연결 분리 / 비활성 블록 연결 과제가 미연결로 나타남(위 결함 방지 확인) / 다른 날짜 과제 배제
- 남은 이슈:
  - architecture.md §5의 API 엔드포인트 표 전체 구현 완료. 다음은 §6 화면(UI) 단계로 넘어갈 차례
  - push는 CLAUDE.md "작업 브랜치에는 자유롭게 push" 규칙에 따라 이어서 진행

## [2026-07-30] fix: GET /api/assignments/:id 라우트 유실 복구
- 배경: PR #12(위 07:45 항목)는 `feature/api-assignment-detail`을 base로 병합됐는데, base인 그 브랜치가 이미 PR #11로 main에 머지된 뒤였음에도 base를 main으로 재설정하지 않았다. 그 결과 PR #12는 GitHub에서 "MERGED"로 표시됐지만 실제로는 main이 아니라 `feature/api-assignment-detail`이라는, main과 더 이상 이어지지 않는 브랜치에 병합됐다. `GET /api/assignments/:id`와 그 e2e 테스트가 main에서 통째로 빠진 채 PR #13~#17이 그 위에서 계속 진행됐다.
- 발견 경위: `feature/ui-today-screen`에서 "/" 화면 e2e 테스트(`today-page.spec.ts`) 중 체크박스 토글 후 `GET /api/assignments/:id`를 호출하는 케이스가 "Unexpected end of JSON input"으로 실패. 원인을 추적하다 main의 `app/api/assignments/[id]/route.ts`에 GET 핸들러 자체가 없다는 걸 확인.
- 변경 파일: app/api/assignments/[id]/route.ts(GET 복구), e2e/assignments-detail-api.spec.ts(GET 테스트 2건 복구), docs/decisions.md(사고 후기 추가)
- 브랜치: fix/restore-assignment-get-route (main 기준)
- 조치: 원래 커밋(fc8297c, `origin/feature/api-assignment-get-by-id`에 여전히 존재)을 `git cherry-pick`으로 main 기준 새 브랜치에 그대로 재적용. docs/decisions.md·worklog.md 충돌만 발생(둘 다 append-only 로그 — 두 쪽 다 보존하고 시간순으로 재배치).
- 검증 결과 (cherry-pick 후 재실행, 모두 실제 실행·출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 최초 실행에서 이전 브랜치 빌드가 남긴 `.next` 캐시 때문에 존재하지 않는 라우트(app/calendar, app/schedule) 타입 참조 에러 발생 → `.next` 삭제 후 재실행해 에러 0 확인(코드 문제 아님)
  - `npm run test`(vitest) — 기존 64개 전부 통과
  - `npm run build` — 성공, `/api/assignments/[id]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 38개 전부 통과, 복구된 GET 테스트 2개 포함(정상 조회+isOverdue 포함 확인, 존재하지 않는 id 404)
- 재발 방지: base가 main이 아닌 PR은 base 브랜치가 main에 머지되는 즉시 `gh pr edit --base main`으로 재설정한다. 그리고 어떤 PR이든 "MERGED" 상태만으로 main 반영을 단정하지 않고, 필요하면 `git log origin/main --oneline | grep <커밋 SHA>`로 직접 확인한다(decisions.md에도 동일 교훈 기록).

## [2026-07-30 12:53] "/" 오늘 할 일 화면 구현 (§6.1)
- 변경 파일: app/page.tsx(전면 교체), app/layout.tsx(dvh·메타데이터), app/_components/assignment-checkbox.tsx(신규), app/_components/bottom-nav.tsx(신규), app/_components/format.ts(신규), app/calendar/page.tsx(신규, placeholder), app/schedule/page.tsx(신규, placeholder), lib/summary/remaining.ts(신규, route에서 추출 + date 필드 추가), app/api/summary/remaining/route.ts(lib 호출로 축소), e2e/today-page.spec.ts(신규), e2e/smoke.spec.ts(수정), e2e/summary-remaining-api.spec.ts(date 필드 검증 추가), tests/format.test.ts(신규), docs/decisions.md(5건 추가)
- 브랜치: feature/ui-today-screen (main 기준)
- 작업 내용: architecture.md §6.1 "오늘 할 일" 화면 구현 — 밀린 것/오늘 할 일(체크박스로 DONE 토글)/이번 주 남은 것 요약, §6.4의 하단 3탭 내비게이션
  - "오늘" 섹션은 완료 포함 전체 필요 → summary/remaining과 별개로 해당 날짜 전체 조회(decisions.md)
  - `/api/summary/remaining`에 `date` 필드 추가해 "오늘" 기준을 서버 단일 소스로 통일(§3.2)
  - `/calendar`, `/schedule`은 준비 중 placeholder로 먼저 만들어 nav 404 방지
  - **버그 발견 및 수정**: "/"가 기본적으로 Static 프리렌더링되는 걸 빌드 로그에서 발견 — `export const dynamic = "force-dynamic"`으로 강제 전환하지 않았다면 매 요청마다 DB를 다시 읽지 않고 빌드 시점 스냅샷을 계속 보여주는 심각한 버그가 됐을 것
  - **더 큰 버그 발견 및 복구**: 이 작업 도중 `GET /api/assignments/:id`가 실제로는 main에 없다는 걸 e2e 실패로 발견 — 별도 fix 브랜치(fix/restore-assignment-get-route, PR #18)로 복구 후 이 브랜치를 그 위에서 재시작. 자세한 경위는 "fix: GET /api/assignments/:id 라우트 유실 복구" 항목 참고
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 에러 0 (중간에 이전 브랜치가 남긴 `.next` 캐시로 존재하지 않는 라우트 타입 에러가 났으나 `.next` 삭제로 해결, 코드 문제 아님)
  - `npm run test`(vitest) — 신규 `format.test.ts` 9개 포함 총 73개 전부 통과
  - `npm run build` — 성공. 최초 빌드에서 "/"가 Static(○)으로 나온 문제를 `force-dynamic`으로 수정 후 재빌드해 Dynamic(ƒ) 확인
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 43개 전부 통과. 신규 5개(today-page.spec.ts): 하단 내비게이션 이동, 밀린 것 섹션 날짜 표시, READING 진도 라벨, 체크박스 토글(DONE↔PLANNED, API로 실제 상태 변경 확인 — 복구된 GET 라우트로 검증), SKIPPED 제외
- 남은 이슈:
  - `/calendar`(§6.2), `/schedule`(§6.3), `/manage/books`, `/manage/routine`은 아직 placeholder/미구현
  - "이번 주 남은 것" 링크는 임의로 `/calendar`로 연결 — 전용 화면이 생기면 재검토
  - PWA manifest(§6.4)는 이번 범위에서 제외

## [2026-07-30 15:32] "/calendar" 달력 뷰 구현 (§6.2)
- 변경 파일: app/calendar/page.tsx(placeholder → 실제 구현), app/calendar/[date]/page.tsx(신규), lib/calendar/grid.ts(신규), app/_components/format.ts(gridDayLabels 추가), tests/calendar-grid.test.ts(신규), tests/format.test.ts(gridDayLabels 3건 추가), e2e/calendar-page.spec.ts(신규), e2e/today-page.spec.ts(placeholder 문구 검증을 실제 heading 검증으로 교체), docs/decisions.md(4건 추가)
- 브랜치: feature/ui-calendar-screen (main 기준)
- 작업 내용: architecture.md §6.2 달력 뷰 구현 — mockup(plan-20days.jpg) 실사진을 직접 확인해 요일 정렬이 아니라 7/29~8/17을 5일씩 순서대로 끊는 그리드임을 확인하고 그대로 재현
  - `lib/calendar/grid.ts` — `VACATION_START`/`VACATION_END`(하드코딩, decisions.md 근거) + `dateRange`/`chunk` 순수 함수
  - `gridDayLabels` — mockup처럼 월이 바뀌는 칸에만 "7/29"·"8/1", 나머지는 "30"·"2"처럼 일자만 표시
  - `/calendar` 페이지: 20일 전체 assignment를 한 번에 조회해 날짜별로 묶어 그리드 렌더링, 오늘 칸 강조, DONE/SKIPPED는 취소선
  - `/calendar/[date]` 페이지: 그날 과제 목록 + 완료 체크(홈 화면 컴포넌트 재사용) — "탭 → 그날 편집"의 1차 범위(전체 CRUD 폼은 아직 없음, decisions.md)
- **실제 앱 구동 검증**: `npm run dev` 백그라운드 실행 후 API로 mockup과 유사한 실데이터(Big Note ch.6/12, 김치찌개, 일기, work sheet 등) 시딩 → Playwright(node 스크립트, chromium-cli 미설치라 playwright 패키지 직접 사용)로 실제 헤드리스 브라우저 스크린샷 확인. 그리드 레이아웃·월 경계 라벨·오늘 강조·완료 취소선이 육안으로 정상 렌더링됨을 확인. 날짜 칸 클릭 → 상세 페이지 이동 → 체크박스 클릭 → 상태 변경까지 실제 클릭으로 재현, `console --errors` 없음 확인 후 시드 데이터 정리
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 에러 0
  - `npm run test`(vitest) — 신규 `calendar-grid.test.ts` 7개 + `format.test.ts`에 `gridDayLabels` 3개 추가, 총 83개 전부 통과
  - `npm run build` — 성공, `/calendar`·`/calendar/[date]`가 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 49개 전부 통과. 신규 6개(calendar-page.spec.ts): 그리드 렌더링+월 경계 라벨, 완료 취소선, 탭→상세 이동+체크박스 토글, 빈 날 안내 문구 없음, SKIPPED 제외, 잘못된 날짜 404. 기존 `today-page.spec.ts`의 달력 placeholder 검증도 실제 heading 검증으로 갱신
- 남은 이슈:
  - `/schedule`(§6.3), `/manage/books`, `/manage/routine`은 아직 placeholder/미구현
  - 과제 생성·필드 수정(제목/날짜/진도 등) 폼은 앱 전체에 아직 없음 — 별도 기능으로 남음

## [2026-07-31 07:40] "/schedule" 시간표 뷰 구현 (§6.3)
- 변경 파일: app/schedule/page.tsx(placeholder → 실제 구현), app/_components/connect-assignment-button.tsx(신규), app/_components/format.ts(formatMinutesAsClock 추가), lib/date.ts(nowMinuteKST 추가), tests/format.test.ts(formatMinutesAsClock 3건 추가), tests/date.test.ts(nowMinuteKST 2건 추가), e2e/schedule-page.spec.ts(신규), e2e/today-page.spec.ts(schedule placeholder 검증을 실제 heading 검증으로 교체), docs/decisions.md(4건 추가)
- 브랜치: feature/ui-schedule-screen (main 기준)
- 작업 내용: architecture.md §6.3 세로 타임라인(7:30~17:00) 구현 — `GET /api/days/:date`를 만들 때 이미 작성한 `lib/days/view.ts`의 `buildDayView`를 그대로 재사용(§4.1의 "isActive 블록 전체 + 그날 Assignment 조인"이 정확히 같은 로직)
  - 블록 높이는 시간 길이에 비례시키지 않고, "지금" 인디케이터는 현재 시각이 속한 블록 자체를 강조하는 방식으로 구현(decisions.md)
  - `formatMinutesAsClock` — 자정 기준 분을 실물 표기 그대로 AM/PM 없는 12시간제로 변환("14:00"이 아니라 "2:00")
  - ROUTINE 블록은 흐리게(`opacity-60`), "과제 연결" 버튼 없음(§4.2)
  - 빈 STUDY 블록에는 `ConnectAssignmentButton`(신규 클라이언트 컴포넌트) — 그날 미연결 과제 중에서 골라 `PATCH .../:id`의 `routineBlockId`로 연결. 새 과제 생성 폼 없이 기존 API만으로 구현(decisions.md, 범위 근거)
- **실제 앱 구동 검증**: `npm run dev`로 실제 서버 실행 후 API로 §4.3 실물 9블록 시드 + 오늘 과제 3건(연결+완료, 연결, 미연결) 생성 → Playwright로 헤드리스 브라우저 스크린샷. 시간 레이블("2:00 ~ 3:00" 등)·ROUTINE 흐림·"지금" 강조·체크박스·과제 연결 버튼이 육안으로 정상 렌더링됨을 확인. "과제 연결" 클릭→후보 선택→실제 연결까지 네트워크 응답(200) 직접 확인 후 시드 데이터 정리(첫 시도는 화면 갱신을 기다리지 않고 스크린샷을 찍어 반영 전 상태를 오인할 뻔했다가 응답 대기로 재확인)
- 검증 결과 (모두 실제 실행, 출력 확인됨):
  - `npm run lint` — 출력 없음(무경고)
  - `npx tsc --noEmit` — 에러 0
  - `npm run test`(vitest) — 신규 `formatMinutesAsClock` 3개, `nowMinuteKST` 2개 포함 총 88개 전부 통과
  - `npm run build` — 성공, `/schedule`이 Dynamic(ƒ)으로 정상 등록됨
  - `npx playwright test`(e2e, 실제 dev 서버+SQLite) — 총 54개 전부 통과. 신규 5개(schedule-page.spec.ts): 연결된 과제 시간 범위+체크, ROUTINE 흐림+버튼 없음, 미연결 과제 연결 플로우, 연결 후보 없을 때 안내, SKIPPED 연결 과제 제외. 기존 today-page.spec.ts의 schedule placeholder 검증도 실제 heading 검증으로 갱신
- 남은 이슈:
  - `/manage/books`, `/manage/routine`은 아직 placeholder/미구현
  - 과제 생성 폼(제목·날짜·유형·진도 등 신규 입력)은 앱 전체에 여전히 없음 — 이제 §6의 5개 화면 중 마지막 두 관리 화면과 이 폼이 남음
  - "지금" 인디케이터는 실행 시각에 의존해 e2e로 결정적 검증 불가 — 실제 구동 스크린샷으로만 확인
