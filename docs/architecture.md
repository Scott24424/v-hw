# v-hw 설계 문서 (초안)

> 상태: **초안**. 코드 작성 전 이 문서를 먼저 확인한다(CLAUDE.md).
> 근거 자료: `docs/mockups/plan-20days.jpg`, `docs/mockups/daily-schedule.jpg`

## 0. 배경

초등학생 아이의 여름방학 숙제 계획을 손으로 쓴 실물 2장을 디지털로 옮겨 **"남은 숙제"** 를 관리한다.
두 실물은 성격이 다르고, 이 차이가 설계 전체의 출발점이다.

### 0.1 plan-20days.jpg — 날짜별 과제 계획표

7/29 ~ 8/17, 5열 × 4행 그리드. 각 날짜에 그날 할 숙제가 0~3개.

| | | | | |
|---|---|---|---|---|
| **7/29** Big Note ch.6 / 김치찌… / 일기 | **30** Big Note ch.12 / work sheet | **31** 엄마 5분만 / 무지개 물고기 | **8/1** Kid Spy ch.10 / 일기 / 김방구 3 | **2** Kid Spy ch.16 / work sheet |
| **3** (빈칸) | **4** 13 Tree House ch.7 / 일기 | **5** 13 Tree House ch.13 / work sheet | **6** Andrew lost / work sheet | **7** 일기 |
| **8** Wimpy Kid ~p.102 / 일기 | **9** Wimpy Kid ~p.217 / work sheet | **10** (빈칸) | **11** Jake Drake Bully Buster / 일기 | **12** Jake Drake Bully Buster / reading project |
| **13** reading project | **14** (빈칸) | **15** (빈칸) | **16** (빈칸) | **17** (빈칸) |

여기서 읽어낸 규칙:

1. **같은 책이 연속된 날에 목표를 전진시키며 반복된다.** Big Note ch.6 → ch.12, 13 Tree House ch.7 → ch.13, Wimpy Kid ~p.102 → ~p.217. 즉 그날의 범위는 "지난번 끝난 데서 여기까지"이고, 실물에는 **끝점만** 적혀 있다.
2. **진도 단위가 두 가지다.** 챕터(ch.6)와 페이지(~p.102).
3. **20일 중 6일이 빈칸이다.** "계획 미정"은 오류가 아니라 정상 상태이며, 모델과 UI가 이걸 허용해야 한다.
4. **유형이 섞여 있다.** 영어책 읽기, 한글책 읽기, work sheet, 일기, reading project.
5. 같은 항목이 여러 날에 반복되지만(일기·work sheet) 각각은 독립된 그날의 과제다.

### 0.2 daily-schedule.jpg — 매일 반복되는 시간표

| 시각 | 내용 |
|---|---|
| 7:30 | 기상 |
| 8:00 | 아침식사 끝내기 |
| 8:00 ~ 10:00 | 원리셈 · 플라토 · 따플 · 디딤돌 (수학 문제집) |
| 10:00 ~ 11:00 | 영어책 읽기 |
| 11:00 ~ 11:30 | 일기쓰기 |
| 11:30 ~ 12:30 | 점심 & 자유시간 |
| 12:30 ~ 12:45 | 뿌리깊은 국어 |
| 12:45 ~ 2:00 | 영어책 읽기 |
| 2:00 ~ 3:00 | 한글책 읽기 |
| 3:00 ~ 5:00 | 영어숙제 끝내기 |

여기서 읽어낸 규칙:

1. **날짜에 묶이지 않는다.** 매일 같은 시각 틀이 적용되고, 그날의 상세 내용만 달라진다.
2. **12시간제 표기다.** "2:00"은 오후 2시다. 저장할 때 24시간제로 정규화해야 한다.
3. **학습이 아닌 블록이 섞여 있다.** 아침식사, 점심 & 자유시간.
4. **취침 블록이 없다.** 실물이 17:00에서 끝난다. 문서는 실물을 그대로 반영하고, 필요하면 나중에 블록을 추가한다.
5. **영어책 읽기 블록이 두 번 나온다.** 블록 라벨은 고유하지 않다.

### 0.3 확정된 전제

| 항목 | 결정 | 근거 |
|---|---|---|
| 배포 / DB | 집 안 상시 구동 PC·NAS에서 `next start`, SQLite 파일 1개를 서버가 단독 소유 | 같은 와이파이의 아이패드·폰이 한 서버에 붙으므로 "여러 디바이스 동일 데이터"가 성립한다. 고정 스택(SQLite)을 그대로 지키면서 새 외부 의존성이 0개다. |
| 사용자 범위 | 아이 1명, 인증 없음. `Child` 테이블 없음 | 열면 바로 오늘 할 일이 나오는 게 아이가 쓰는 데 가장 중요하다. 집 내부망 전용이 전제다. |
| 밀린 숙제 | 원래 날짜를 유지하고, 오늘 화면 상단에 별도 섹션으로 노출 (이월 없음) | 계획표 원본이 훼손되지 않아 "어느 날 계획이 자꾸 밀리는지"가 보인다. 날짜 필드 하나로 끝나 가장 단순하다. |

---

## 1. 데이터 모델 (ERD)

모델 3개. `Assignment`가 중심이고 `Book`과 `RoutineBlock`이 각각 nullable FK로 붙는다.

```
┌──────────────┐          ┌───────────────────────────┐          ┌──────────────────┐
│     Book     │          │        Assignment         │          │   RoutineBlock   │
├──────────────┤          ├───────────────────────────┤          ├──────────────────┤
│ id           │          │ id                        │          │ id               │
│ title        │ 1     0..n│ date        "YYYY-MM-DD"  │0..n     1│ startMinute  Int │
│ language     │──────────│ type                      │──────────│ endMinute    Int │
│ totalChapters│  bookId  │ title                      │ routine  │ label            │
│ totalPages   │          │ note?                     │ BlockId  │ category         │
└──────────────┘          │ status                    │          │ sortOrder        │
                          │ sortOrder                 │          │ isActive         │
                          │ ─── READING 전용 ───       │          └──────────────────┘
                          │ bookId?                   │
                          │ progressUnit?             │
                          │ progressStart?            │
                          │ progressEnd?              │
                          │ ───────────────────       │
                          │ completedAt?              │
                          └───────────────────────────┘
```

### 1.1 왜 이렇게 나눴나

| 결정 | 이유 | 대안과 비교 |
|---|---|---|
| **날짜별 과제(`Assignment`)와 반복 시간표(`RoutineBlock`)를 완전히 분리** | 둘의 생명주기가 다르다. 과제는 하루짜리 사실이고 시간표는 방학 내내 유지되는 틀이다. 한 테이블에 섞으면 "날짜가 없는 행"과 "시각이 없는 행"이 공존해 모든 쿼리에 분기가 생긴다. | 하나의 `Task` 테이블에 `date?` + `startMinute?`로 합치는 안 — 두 개념의 필수 필드가 정반대라 NOT NULL 제약을 아무 데도 걸 수 없다. 기각. |
| **둘을 `Assignment.routineBlockId`(nullable)로 연결** | "이 시간 블록에서 오늘 이 과제를 한다"는 관계를 과제 쪽에 둔다. 연결은 선택이므로 nullable — 실물에도 시간표에 매칭되지 않는 과제(reading project)가 있다. | 조인 테이블(`BlockAssignment`) — 한 과제가 여러 블록에 걸치는 경우가 없으므로 과잉. |
| **`Book`을 별도 테이블로 분리** | 같은 책이 여러 날에 걸쳐 나오고(Big Note ×2, Kid Spy ×2, 13 Tree House ×2, Wimpy Kid ×2, Jake Drake ×2), **진도를 이어붙이려면 "같은 책"이라는 동일성 판단이 필요**하다. 제목 문자열 비교로는 오타 하나에 진도가 끊긴다. | `Assignment.bookTitle` 문자열 — 진도 자동 이어붙이기가 불가능해진다. 기각. |

### 1.2 날짜는 `String` "YYYY-MM-DD"로 저장한다

과제의 날짜는 시각이 아니라 **달력상의 날**이다. SQLite에는 DATE 타입이 없고 Prisma `DateTime`은 실제로 타임스탬프로 저장되므로, KST(UTC+9) 환경에서는 "8월 3일"이 `2026-08-02T15:00:00Z`가 되어 자정 경계마다 하루가 밀리는 버그가 **구조적으로** 발생한다.

ISO 8601 문자열은 사전순 정렬 = 시간순 정렬이라 `gte` / `lte` / `lt` 범위 쿼리가 그대로 동작하고 인덱스도 정상적으로 탄다.

- **대안**: `DateTime` + UTC 자정 정규화 — 모든 읽기·쓰기 지점에서 변환을 한 번도 빠뜨리지 않아야 성립한다. 지점이 늘어날수록 깨질 확률만 올라가므로 기각.
- **대가**: Prisma의 날짜 헬퍼를 못 쓴다. 대신 `formatDate` / `parseDate` / `addDays` / `startOfWeek` 유틸을 직접 두고 단위 테스트로 덮는다.

### 1.3 시각은 `Int`(자정 기준 분)로 저장한다

7:30 → `450`, 12:45 → `765`, 17:00 → `1020`.

실물이 12시간제라 "2:00"이 오전인지 오후인지 표기만으로는 모호한데, 정수로 정규화하면 그 모호함이 저장 시점에 사라진다. 정렬과 블록 겹침 검사가 산술 비교로 끝나고, 문자열 `"09:00"` 대비 `"9:00"` 같은 포맷 흔들림도 없다.

- **대안**: `"HH:mm"` 문자열 — 사람이 읽기 좋지만 겹침 계산 때마다 파싱이 필요하고 zero-padding 규칙을 강제해야 한다.

### 1.4 `progressStart`는 생성 시점에 채워서 저장한다

실물에는 끝 목표만 있고("ch.12") 시작점은 "이전 회차 다음"이라는 암묵 규칙이다. 읽기 과제를 만들 때 같은 `bookId`의 직전 `progressEnd + 1`을 자동으로 채우되, 수정 가능하게 둔다.

**읽을 때마다 파생 계산하지 않는 이유**: 앞선 과제가 수정·삭제되면 이미 완료된 과거 기록의 범위가 소급해서 바뀐다. "지난주에 내가 어디까지 읽었지"의 답이 달라지면 안 된다. 진도는 사후에 변하지 않는 사실이므로 그 시점에 확정해 저장한다.

### 1.5 Prisma 스키마 (예정)

```prisma
enum AssignmentType   { READING WORKSHEET DIARY PROJECT OTHER }
enum AssignmentStatus { PLANNED IN_PROGRESS DONE SKIPPED }
enum ProgressUnit     { CHAPTER PAGE }
enum BookLanguage     { EN KO }
enum BlockCategory    { STUDY ROUTINE }

model Book {
  id            Int          @id @default(autoincrement())
  title         String
  language      BookLanguage
  totalChapters Int?
  totalPages    Int?
  assignments   Assignment[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([title, language])
}

model RoutineBlock {
  id          Int            @id @default(autoincrement())
  startMinute Int            // 자정 기준 분, 0~1439
  endMinute   Int
  label       String
  category    BlockCategory  @default(STUDY)
  sortOrder   Int            @default(0)
  isActive    Boolean        @default(true)
  assignments Assignment[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([isActive, startMinute])
}

model Assignment {
  id             Int              @id @default(autoincrement())
  date           String           // "YYYY-MM-DD"
  type           AssignmentType
  title          String
  note           String?
  status         AssignmentStatus @default(PLANNED)
  sortOrder      Int              @default(0)
  completedAt    DateTime?

  // READING 전용 — 그 외 유형에서는 전부 null
  bookId         Int?
  book           Book?            @relation(fields: [bookId], references: [id])
  progressUnit   ProgressUnit?
  progressStart  Int?
  progressEnd    Int?

  routineBlockId Int?
  routineBlock   RoutineBlock?    @relation(fields: [routineBlockId], references: [id])

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([date])
  @@index([status, date])
}
```

`title`을 `Book`이 있는데도 따로 두는 이유: 모든 유형이 공유하는 표시용 이름이 하나 필요하다(work sheet, 일기). READING이면 생성 시 책 제목을 복사해 넣어, 목록 렌더링이 유형에 따라 분기하지 않아도 된다.

인덱스 두 개의 용도: `[date]`는 달력 뷰의 범위 조회, `[status, date]`는 "밀린 것" 조회(`status IN (PLANNED, IN_PROGRESS) AND date < 오늘`).

---

## 2. 과제 유형 모델링 — 단일 테이블 + `type` 컬럼

### 2.1 세 가지 안 비교

| | **A. 단일 테이블 + type** | **B. 기본 테이블 + ReadingDetail 1:1** | **C. 유형별 분리 테이블** |
|---|---|---|---|
| "남은 숙제 전체를 날짜순" | 인덱스 1회 스캔 | LEFT JOIN 1회 | N개 테이블 UNION |
| Prisma 지원 | 자연스러움 | 자연스러움 | **다형 관계 미지원** → 앱에서 N회 쿼리 후 메모리 병합·재정렬 |
| 유형 추가 비용 | enum 값 1개 | enum 값 1개 (+ 필요시 테이블) | 테이블 1개 + 모든 집계 쿼리 수정 |
| 스키마 정합성 | 앱 레벨 검증 필요 | DB가 일부 보장 | DB가 강하게 보장 |
| 정렬·페이지네이션 | DB가 처리 | DB가 처리 | **앱 메모리에서 처리** |
| 비용 | nullable 컬럼 4개 | 조인 1회 + 테이블 1개 | 높음 |

### 2.2 A를 채택한다

이 앱의 **핵심 기능이 "유형과 무관하게 남은 것 전부를 날짜순으로"** 다. 오늘 화면, 밀린 것 섹션, 이번 주 남은 개수가 전부 유형을 가로지르는 집계다.

- A에서 이건 인덱스 하나로 끝난다.
- C에서는 매번 5개 테이블을 각각 조회해 앱 메모리에서 합치고 다시 정렬해야 한다. Prisma에 다형 관계가 없으므로 우회로도 없고, 유형을 하나 추가할 때마다 모든 집계 지점을 고쳐야 한다. 이 앱에서 가장 자주 실행되는 쿼리를 가장 비싸게 만드는 선택이라 기각.
- B는 합리적인 중간안이지만, 읽기 전용 필드가 지금 4개뿐이라 테이블을 하나 더 두는 값을 못 한다.

**A의 대가는 "READING이 아닌데 `progressEnd`가 들어있는 행"이 물리적으로 가능하다는 것**이다. 이건 애플리케이션 레벨 검증으로 막는다:

```
type === READING  ⇒ bookId, progressUnit, progressEnd 필수
type !== READING  ⇒ bookId, progressUnit, progressStart, progressEnd 모두 null
progressStart != null && progressEnd != null ⇒ progressStart <= progressEnd
```

이 규칙은 **정상 케이스와 규칙 위반 케이스를 모두** 단위 테스트로 덮는다(CLAUDE.md).

**B로 이전하는 트리거**: 읽기 전용 필드가 6개를 넘거나, READING 외에 다른 유형도 고유 필드를 갖기 시작하는 시점. 그때는 `Assignment`에서 읽기 컬럼을 떼어 `ReadingDetail`로 옮기는 마이그레이션 한 번으로 끝난다.

### 2.3 유형 정의

| enum | 실물 근거 | 고유 필드 |
|---|---|---|
| `READING` | Big Note ch.6, Wimpy Kid ~p.102, 엄마 5분만, 한글책 읽기 | `bookId`, `progressUnit`, `progressStart`, `progressEnd` |
| `WORKSHEET` | work sheet | 없음 |
| `DIARY` | 일기 | 없음 |
| `PROJECT` | reading project | 없음 |
| `OTHER` | 분류되지 않는 것 | 없음 |

영어책과 한글책을 별도 유형으로 나누지 않고 `Book.language`로 구분하는 이유: 진도 관리 방식이 완전히 같아서 유형을 나눠도 코드가 한 줄도 갈라지지 않는다. 언어는 책의 속성이지 과제의 속성이 아니다.

---

## 3. 상태 전이

### 3.1 저장되는 상태는 4개

```
                    ┌─────────────────────────────┐
                    │      (되돌리기 / 실수 복구)     │
                    ▼                             │
             ┌───────────┐   시작    ┌─────────────┴─┐   완료    ┌────────┐
   생성 ────▶│  PLANNED  │─────────▶│  IN_PROGRESS  │─────────▶│  DONE  │
             └─────┬─────┘          └───────┬───────┘          └───┬────┘
                   │                        │                      │
                   │  바로 완료 ──────────────┼──────────────────────▶│
                   │                        │                      │
                   │  안 하기로 함             │  안 하기로 함           │  안 하기로 함
                   ▼                        ▼                      ▼
             ┌──────────────────────────────────────────────────────────┐
             │                        SKIPPED                           │
             └──────────────────────────────────────────────────────────┘
                                          │
                                          └──▶ PLANNED (되살리기)
```

허용 전이:

| From | To |
|---|---|
| `PLANNED` | `IN_PROGRESS`, `DONE`, `SKIPPED` |
| `IN_PROGRESS` | `DONE`, `SKIPPED`, `PLANNED` |
| `DONE` | `PLANNED`, `SKIPPED` |
| `SKIPPED` | `PLANNED` |

- `PLANNED → DONE` 직행을 허용하는 이유: 아이가 체크박스를 한 번 눌러 끝내는 게 기본 동작이다. `IN_PROGRESS`를 강제로 거치게 하면 탭이 두 번이 된다.
- `DONE → PLANNED` 되돌리기를 허용하는 이유: 아이가 잘못 눌렀을 때 복구 수단이 없으면 안 된다.
- `SKIPPED`를 두는 이유: 계획이 바뀌어 안 하기로 한 항목이 "밀린 것" 목록에 영원히 쌓이는 걸 막는다. 삭제와 달리 "안 했다"는 기록은 남는다.
- `DONE`으로 갈 때 `completedAt`을 찍고, 벗어날 때 `null`로 되돌린다.

### 3.2 "밀림(overdue)"은 상태가 아니라 계산값

정의: `date < 오늘 && status ∈ { PLANNED, IN_PROGRESS }`

| | **계산 (채택)** | 별도 상태 `OVERDUE`로 저장 |
|---|---|---|
| 정확성 | 항상 정확 | 자정 배치가 실제로 돌아야 정확 — **집 PC가 절전이면 DB가 거짓말을 한다** |
| 날짜를 미뤘을 때 | 자동으로 반영 | 상태도 같이 되돌려야 함 (누락 시 불일치) |
| 완료 처리했을 때 | 자동으로 빠짐 | 별도 처리 필요 |
| 상태 전이 복잡도 | 4개 상태 그대로 | `OVERDUE` ↔ 나머지 전이가 전부 추가됨 |
| 쿼리 | `@@index([status, date])`로 충분 | 인덱스 직접 가능 |
| 인프라 | 없음 | 스케줄러 필요 |

여름 한 철 데이터가 100행 미만이라 성능 차이는 무의미하고, 저장 방식은 **배치가 안 돌면 데이터가 틀어지는 리스크만** 추가한다. 상시 구동 PC가 절전에 들어가는 게 충분히 흔한 시나리오라 이 리스크는 이론적인 게 아니다. 계산을 채택한다.

**단, "오늘"의 기준은 서버 한 곳(Asia/Seoul)이다.** API 응답에 `isOverdue` 파생 필드를 실어 보내고 클라이언트는 그걸 그대로 쓴다. 각 기기가 자기 시계로 계산하면 아이패드와 폰이 서로 다른 목록을 보여줄 수 있는데, "여러 디바이스에서 동일한 데이터"가 요구사항이므로 허용되지 않는다.

---

## 4. 시간표와 과제의 연결

### 4.1 템플릿만 두고 날짜별 행은 만들지 않는다

특정 날짜의 시간표 = `isActive`인 `RoutineBlock` 전체 + 그 날짜의 `Assignment`를 `routineBlockId`로 조인한 결과. 날짜별 시간표 행은 DB에 존재하지 않는다.

이유: "시간 틀은 매일 동일하고 내용만 다르다"가 정확히 이 구조다. 생성 배치가 필요 없고, 블록 시각을 한 번 고치면 전 기간에 즉시 반영되며, 20일치 × 10블록 = 200행을 미리 만들어둘 필요도 없다.

- **대안**: 날짜별 `ScheduleInstance` 실체화 — "오늘만 시간 변경", "오늘은 이 블록 건너뛰기"가 요구사항이 될 때 필요하다. 지금은 요구사항이 아니다.
- **이전 경로**: 그때 `ScheduleInstance(date, blockId, startMinute?, endMinute?, skipped)` 테이블을 추가하고, 해당 날짜 행이 없으면 템플릿으로 폴백하면 된다. **기존 데이터 변경 없이 추가만으로 가능**하므로 지금 미리 만들 이유가 없다.

### 4.2 블록 카테고리

`STUDY`와 `ROUTINE`을 구분한다. 아침식사, 점심 & 자유시간은 `ROUTINE`이라 과제를 연결하지 않고 UI에서 흐리게 표시한다. 이걸 구분하지 않으면 시간표 뷰가 "점심시간에 연결된 과제가 없음"을 미완료처럼 보여주게 된다.

실물의 "7:30 기상 / 8:00 아침식사 끝내기"는 두 시각이 아니라 **7:30~8:00 블록 하나**로 자연스럽게 접힌다.

### 4.3 초기 시드

실물의 10개 블록을 그대로 넣는다.

| startMinute | endMinute | label | category |
|---|---|---|---|
| 450 | 480 | 기상 & 아침식사 | ROUTINE |
| 480 | 600 | 수학 문제집 (원리셈·플라토·따플·디딤돌) | STUDY |
| 600 | 660 | 영어책 읽기 | STUDY |
| 660 | 690 | 일기쓰기 | STUDY |
| 690 | 750 | 점심 & 자유시간 | ROUTINE |
| 750 | 765 | 뿌리깊은 국어 | STUDY |
| 765 | 840 | 영어책 읽기 | STUDY |
| 840 | 900 | 한글책 읽기 | STUDY |
| 900 | 1020 | 영어숙제 끝내기 | STUDY |

실물에 취침 블록이 없어 17:00에서 끝난다. 필요해지면 블록을 추가하면 되고, 스키마 변경은 없다.

---

## 5. API 엔드포인트

Next.js App Router의 route handler(`app/api/**/route.ts`)로 구현한다. 응답은 모두 JSON.

| Method | Path | 용도 |
|---|---|---|
| `GET` | `/api/assignments?from=&to=&status=&type=` | 범위 조회 — 달력 뷰 |
| `POST` | `/api/assignments` | 생성. READING이면 `progressStart` 자동 채움 |
| `GET` | `/api/assignments/:id` | 단건 조회 |
| `PATCH` | `/api/assignments/:id` | 수정 (날짜·제목·진도·블록 연결·정렬) |
| `DELETE` | `/api/assignments/:id` | 삭제 |
| `PATCH` | `/api/assignments/:id/status` | **아이용 원터치 상태 변경** |
| `GET` | `/api/summary/remaining` | `{ overdue[], today[], thisWeek[], counts }` |
| `GET` | `/api/days/:date` | 그날 시간표 블록 + 연결된 과제 + 미연결 과제 |
| `GET` `POST` | `/api/books` | 책 목록 · 등록 |
| `PATCH` | `/api/books/:id` | 책 수정 |
| `GET` `POST` | `/api/routine-blocks` | 시간표 조회 · 추가 |
| `PATCH` `DELETE` | `/api/routine-blocks/:id` | 시간표 수정 · 삭제 |

### 5.1 설계 이유

- **`PATCH /api/assignments/:id/status`를 일반 PATCH와 분리한다.** 아이 UI가 호출하는 유일한 쓰기 엔드포인트이고 검증 규칙이 다르다 — 전이 규칙만 검사하고 다른 필드는 아예 건드릴 수 없다. 합쳐두면 체크박스 한 번이 이론상 과제 전체를 덮어쓸 수 있는 요청이 된다.
- **`GET /api/days/:date`를 따로 둔다.** 오늘 화면이 가장 자주 열리는데 블록과 과제를 각각 부르면 왕복이 2회다. 화면 하나가 요청 하나로 끝나게 한다.
- **`GET /api/summary/remaining`을 따로 둔다.** "남은 숙제"가 이 앱의 핵심이고, 밀린 것 / 오늘 / 이번 주는 각각 다른 날짜 조건이라 클라이언트에서 한 배열을 세 번 거르는 것보다 서버가 "오늘" 기준으로 한 번에 나눠 주는 게 맞다(§3.2).
- **삭제는 물리 삭제.** 잘못 지운 걸 되살릴 필요가 있으면 `SKIPPED`가 이미 그 역할을 한다. soft delete는 모든 쿼리에 필터를 하나씩 추가시키는 비용에 비해 얻는 게 없다.

### 5.2 공통 규약

- 모든 응답의 `Assignment` 객체에 파생 필드 `isOverdue: boolean`을 포함한다.
- 날짜 파라미터는 `YYYY-MM-DD`. 형식이 어긋나면 400.
- 검증 실패는 400, 없는 리소스는 404, 허용되지 않은 상태 전이는 409.
- 인증 없음(§0.3). 집 내부망 전용이 전제이므로 공개망에 노출하려면 이 결정을 다시 봐야 한다.

---

## 6. 화면

| 경로 | 화면 | 내용 |
|---|---|---|
| `/` | **오늘 할 일** (기본 진입) | ① 밀린 것 ② 오늘 ③ 이번 주 남은 개수. 큰 체크박스 원터치 |
| `/calendar` | **달력 뷰** | 실물과 같은 5열 그리드. 날짜 칸에 과제 칩 + 완료 표시. 탭 → 그날 편집 |
| `/schedule` | **시간표 뷰** | 세로 타임라인(7:30~17:00). 블록마다 그날 연결된 과제. 현재 시각 인디케이터 |
| `/manage/books` | 책 관리 | 책 목록, 진도 현황 |
| `/manage/routine` | 시간표 관리 | 블록 추가·수정·삭제 |

### 6.1 오늘 할 일 (`/`)

기본 진입 화면이다. 아이가 앱을 여는 이유의 대부분이 "지금 뭐 해야 하지"이므로 달력이 아니라 이 화면이 먼저 나온다.

```
┌────────────────────────────────────┐
│  8월 3일 월요일                       │
│                                    │
│  ⚠ 밀린 것 2개                       │
│  ┌──────────────────────────────┐  │
│  │ ☐  Big Note ch.6      7/29   │  │
│  │ ☐  일기                7/29   │  │
│  └──────────────────────────────┘  │
│                                    │
│  오늘 할 일 3개 중 1개 완료             │
│  ┌──────────────────────────────┐  │
│  │ ☑  Kid Spy ch.10             │  │
│  │ ☐  work sheet                │  │
│  │ ☐  일기                       │  │
│  └──────────────────────────────┘  │
│                                    │
│  이번 주 남은 것 7개  →               │
├────────────────────────────────────┤
│   오늘      달력      시간표           │
└────────────────────────────────────┘
```

밀린 것을 맨 위에 두는 이유: 원래 날짜에 그대로 남겨두기로 했으므로(§0.3) 오늘 화면에서 보이지 않으면 영원히 묻힌다.

### 6.2 달력 뷰 (`/calendar`)

실물의 5열 그리드를 그대로 재현한다. 아이와 부모가 이미 벽에 붙은 종이로 이 배치에 익숙해서, 7열 월간 달력으로 바꾸면 오히려 대조가 어려워진다.

빈 날짜는 빈 칸으로 그대로 둔다 — "계획 미정"은 정상 상태이므로(§0.1) 경고나 빈 상태 안내를 띄우지 않는다.

### 6.3 시간표 뷰 (`/schedule`)

세로 타임라인. 블록 높이는 실제 시간 길이에 비례시키지 않는다 — 12:30~12:45(15분)와 8:00~10:00(2시간)의 높이 차가 8배가 되면 짧은 블록의 글씨를 읽을 수 없다. 대신 블록마다 시각을 텍스트로 표시한다.

`STUDY` 블록에는 그날 연결된 과제를 보여주고, 연결이 없으면 "과제 연결" 버튼을 둔다. `ROUTINE` 블록은 흐리게.

### 6.4 아이패드 에어 4 우선 (1180 × 820 pt)

- **하단 3탭 내비게이션.** 태블릿을 양손으로 들었을 때 엄지가 닿는 위치다. 상단 탭은 손을 옮겨야 한다.
- **터치 타깃 44 pt 이상.** 특히 체크박스는 아이가 정확히 조준하지 않아도 눌리도록 크게.
- **hover 전용 조작을 만들지 않는다.** 터치에는 hover가 없어 그 기능에 도달할 방법이 사라진다.
- **높이는 `dvh` 단위.** iPad Safari의 주소창 유무로 `vh`가 흔들린다.
- **가로/세로 모두 지원.** 달력은 가로에서 5열을 유지하고 세로에서는 5열 유지 + 세로 스크롤(열 수를 바꾸면 실물과의 대조가 깨진다).
- **PWA manifest**로 홈 화면 추가를 지원한다. Next 내장 metadata 기능이라 새 의존성이 없다.

---

## 7. 미결 사항

### 7.1 설치 전 확인이 필요한 의존성

CLAUDE.md가 새 외부 의존성 추가 시 질문을 요구하므로, 다음 단계(스캐폴딩)에서 **설치 직전에 확인**한다.

| 패키지 | 용도 | 비고 |
|---|---|---|
| `next` `react` `typescript` `prisma` `@prisma/client` | 고정 스택 | 사실상 확정 |
| `vitest` | 테스트 러너 | CLAUDE.md 완료 조건에 `npm run test`가 있으나 러너가 미정 |
| `zod` | §2.2의 유형별 필드 검증 | 수기 검증 + 타입 가드로 대체 가능 |
| Tailwind CSS 등 | 스타일 방식 | `create-next-app` 시점의 선택 |

### 7.2 이 문서가 아직 정하지 않은 것

- **백업.** SQLite 파일 하나에 방학 전체 계획이 들어있고 그 PC가 유일한 사본이다. 최소한 파일 복사 스크립트라도 필요하다.
- **취침 시각.** 실물 시간표가 17:00에서 끝난다(§0.2).
- **주말 처리.** 실물에는 요일 구분이 없다. 주말에도 같은 시간표가 적용되는지 확인이 필요하다.
- **`Book.totalChapters` / `totalPages`의 출처.** 입력하면 "전체 대비 진도"를 보여줄 수 있지만 아무도 안 채우면 무의미한 컬럼이다. 선택 입력으로 두고 실사용을 본다.

### 7.3 완료 조건에 대하여

이 문서 작성 시점에는 `package.json`이 없어 CLAUDE.md의 완료 조건(`lint` / `tsc --noEmit` / `test` / `build`) 네 가지 모두 **실행 자체가 불가능**하다. 완료 조건은 첫 코드 커밋부터 적용한다.
