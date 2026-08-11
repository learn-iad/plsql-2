# PL/SQL Oracle Trainer — SPEC (для агента, не для UI)

## Назначение
Статический одностраничник. Пользователь решает в PL/SQL Developer → вставляет код → тренажёр **анализирует текст** (не исполняет Oracle).

## Стек
- `index.html` + `js/*.js`, без сборки/npm/TS
- История: `localStorage` ключ `plsql_trainer_v1`

## Модули
| Файл | Роль |
|------|------|
| `js/util.js` | нормализация SQL, комментарии, split statements |
| `js/oracle-errors.js` | эмуляция ORA-* + развёрнутые пояснения |
| `js/checker.js` | движок рубрики: `{id, label, weight, check(code, ctx)}` |
| `js/tasks.js` | массив TASKS: `{id, title, html, rubric, hints}` |
| `js/history.js` | save/load попыток, итоговый отчёт сильные/слабые |
| `index.html` | UI: задание, редактор, результат, история, отчёт |

## Проверка (task1 — Agent/AGENTS)
Критерии (варiatивность):
- CREATE Agent: id NUMBER, sLogin VARCHAR2(150), sPassword VARCHAR2(30)
- ALTER ADD dBirthDate DATE
- DROP (не DELETE) — DELETE → штраф + пояснение про purge позже
- CTAS `AGENTS` from `edu.agents`
- 9× ALTER MODIFY default (допуск: to_date или строка для end_date)
- INSERT: seqEduAgents.nextval, nrating=99, begin_date сен-2025
- ALTER idsupervisor + UPDATE 1000 + UPDATE 2000 WHERE agent<500
- SELECT: agent,sname,nrating,idsupervisor,top_filial + ORDER contract_date + TOP 50 (FETCH/ROWNUM/подзапрос — OK при комментарии-обосновании)
- Комментарии `--`/`/*` обязательны (развилки)
- Схема перед таблицами: обязательна в CREATE своих таблиц и во 2-м UPDATE; в скриптах из задания — опционально
- Алиасы в UPDATE/SELECT (ag.)

## Oracle-эмуляция (типовые)
ORA-00942, ORA-00904, DELETE вместо DROP, UPDATE без alias, COMMIT не упомянут (info)

## UI-поток
1. Читает задание → 2. Вставляет код → 3. «Проверить» → 4. Баллы + ORA + слабые места → 5. История → 6. Финальный отчёт

## Расширение
Новая задача = объект в `tasks.js` + rubric-массив. Не трогать checker/history.
