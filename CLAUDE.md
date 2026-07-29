# CLAUDE.md

## 프로젝트 개요
- 남은 방학숙제 관리 웹앱 v-hw

## 개발 규칙
- 모든 커밋은 Conventional Commits 형식 (feat:, fix:, test:, docs:, chore:)
- 새 기능은 반드시 단위 테스트와 함께 작성
- any 타입 금지, 환경 변수는 .env.local에만 저장
- main 직접 커밋 금지. 기능은 브랜치 + PR로만 진행

## 금지 사항
- .env 파일에 더미/가짜 값 삽입 금지. 값이 없으면 사용자에게 질문할 것
- 마이그레이션 파일 직접 수정 금지
- git push는 사용자 승인 후에만 실행
