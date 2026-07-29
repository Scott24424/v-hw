# 결정 기록

- [2026-07-29] .claude/settings.json의 deny 규칙을 `Read(./.env)` → `Read(.env)` (및 `.env.*` 동일)로 수정. 공식 문서(code.claude.com/docs/en/permissions) 기준 지원되는 앵커 형식은 bare filename / `/path` / `//path` / `~/path` 뿐이며 `./path`는 명시되어 있지 않아 매칭이 보장되지 않음. bare filename 형식은 `**/.env`와 동일하게 어떤 깊이에서도 매칭됨이 문서로 확인됨.
- [2026-07-29] `Assignment.date`를 `DateTime`이 아니라 `String`("YYYY-MM-DD")으로 저장. SQLite에 DATE 타입이 없어 Prisma `DateTime`은 타임스탬프로 저장되고, KST(+9)에서 자정 경계마다 하루 밀리는 버그가 구조적으로 발생함. ISO 문자열은 사전순=시간순이라 범위 쿼리·인덱스가 그대로 동작. 대가로 날짜 유틸을 직접 만들고 단위 테스트로 덮는다.
- [2026-07-29] 시각은 `Int`(자정 기준 분)로 저장. 실물 시간표가 12시간제 표기라 "2:00"의 오전/오후가 모호한데 정수 정규화로 저장 시점에 해소되고, 정렬·겹침 검사가 산술 비교로 끝남.
- [2026-07-29] 과제 유형은 단일 `Assignment` 테이블 + `type` enum으로 모델링(유형별 분리 테이블 기각). 핵심 기능이 "유형 무관 남은 것 전부를 날짜순"이라 단일 인덱스 스캔으로 끝나야 하는데, 분리 테이블은 Prisma에 다형 관계가 없어 매번 N회 쿼리 후 앱 메모리에서 병합·재정렬해야 함. 대가인 nullable 컬럼 4개는 앱 레벨 검증으로 커버. 읽기 전용 필드가 6개를 넘으면 `ReadingDetail` 1:1 분리로 이전.
- [2026-07-29] "밀림(overdue)"은 상태로 저장하지 않고 `date < 오늘 && status ∈ {PLANNED, IN_PROGRESS}`로 계산. 저장 방식은 자정 배치가 필요한데 상시 구동 PC가 절전에 들어가면 DB가 거짓말을 하게 됨. 단 "오늘"의 기준은 서버(Asia/Seoul) 한 곳으로 두고 API가 `isOverdue` 파생 필드를 내려보냄 — 기기별 시계가 어긋나 아이패드와 폰이 다른 목록을 보여주는 것을 막기 위함.
- [2026-07-29] 시간표는 `RoutineBlock` 템플릿만 두고 날짜별 행을 실체화하지 않음. "시간 틀은 매일 동일, 내용만 다름"이라는 요구사항과 정확히 일치하고 생성 배치가 불필요. "오늘만 시간 변경/건너뛰기"가 필요해지면 `ScheduleInstance` 테이블 추가 + 행 없으면 템플릿 폴백으로, 기존 데이터 변경 없이 이전 가능.
- [2026-07-29] docs/architecture 브랜치를 main이 아니라 chore/agent-rules HEAD 기준으로 생성. main에는 `.gitignore`/`README.md`뿐이고 CLAUDE.md·decisions.md·worklog.md가 전부 미머지 상태의 chore/agent-rules에만 있어, main 기준으로 파면 두 문서를 새로 만들게 되어 충돌이 확정됨. PR base도 chore/agent-rules로 둔다.
