# 프랑스 혁명 타임라인 (교과서 144~145쪽)

핸드오프 문서 v1 기준 구현. plain HTML/CSS/JS, 빌드 없음. 로컬 확인: `python3 -m http.server` 후 `index.html`.

- 파일: `index.html` / `style.css` / `data.js`(학생 화면 문구, 핸드오프 5번) / `app.js`(화면·상태·제출) / `snippets/`(focus_guard, glossary — history26 레포 사본)
- URL 파라미터: `?sid=20512&name=이름` 자동채움, `?preview=1` 미리보기(저장 안 함)
- 기록: 글쓰기 화면 "기록하기"가 history26_backend 기본 제출 경로(`gameName` 필수)로 POST. `choicesJson`의 역할 키는 `persona`(백엔드 칭호 판정이 `role` 키를 읽음)
- 임시값: `CONFIG.GAME_NAME = '프랑스혁명_타임라인'` — 포털 차시 id가 정해지면 교체
- 장면 이미지: `assets/scenes/scene-N.webp` 를 넣고 `data.js`의 `image.src`만 채우면 된다(비어 있거나 파일이 없으면 영역 숨김)

## 검증 상태 (학생 화면에는 표시하지 않음)
- 교과서 밖 사실은 핸드오프 9번 목록(위키백과 2차 확인)만 사용. 학교 자료로 공유하기 전 1차 자료 대조 필요
- GLOSSARY 풀이는 낱말 뜻 수준. `봉건제`·`공포 정치` 풀이는 효니가 직접 준 문장

## 브랜드 색(indigo) 대비
| 테마 | 조합 | 대비 | 기준 |
|---|---|---|---|
| 라이트 | fg-brand #3a4a9e / layer-default | 7.92 | 4.5 |
| 라이트 | fg-brand-contrast #212c62 / brand-weak | 11.55 | 4.5 |
| 라이트 | 흰 글자 / bg-brand-solid #3a4a9e | 7.92 | 4.5 |
| 라이트 | stroke-brand-solid / layer-default | 7.92 | 3 |
| 다크 | fg-brand #96a3e8 / layer-default | 7.66 | 4.5 |
| 다크 | fg-brand-contrast #ccd3f7 / brand-weak | 10.52 | 4.5 |
| 다크 | 흰 글자 / bg-brand-solid #4553ab | 6.82 | 4.5 |
| 다크 | stroke-brand-solid #6b79d0 / layer-default | 4.64 | 3 |
