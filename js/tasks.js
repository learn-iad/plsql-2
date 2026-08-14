/* eslint-disable no-unused-vars */
var ALL_TASKS = [
  {
    id: 'task1_agents',
    title: 'Задание 1 — Agent / AGENTS',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка (несколько трактовок, дополнительная команда, выбор подхода) — обязательно поясните её в комментарии в SQL-коде.</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li>Создайте таблицу <b>Agent</b>: Id (NUMBER), sLogin (VARCHAR2 150), sPassword (VARCHAR2 30).</li>' +
      '<li>Добавьте столбец <b>dBirthDate</b> (DATE).</li>' +
      '<li>Удалите таблицу <b>с возможностью восстановления</b> (DROP, не DELETE).</li>' +
      '<li>Скопируйте <b>edu.agents</b> в AGENTS (CREATE TABLE … AS SELECT).</li>' +
      '<li>Задайте значения по умолчанию: <b>end_date</b> = DATE \'2026-01-01\', <b>auto_fix_comm</b> = \'Y\', <b>is_ichp</b> = \'Y\', <b>is_filial</b> = \'Y\', <b>top_filial</b> = 1, <b>in_premium</b> = \'Y\', <b>ichp_old</b> = 1, <b>idrappeltype</b> = 1, <b>lnetwork_develop</b> = \'Y\'.</li>' +
      '<li>INSERT: agent = edu.seqEduAgents.nextval, nrating = 99, begin_date = 01.09.2025. Не забудьте COMMIT в PL/SQL Developer.</li>' +
      '<li>ALTER ADD idsupervisor; UPDATE всех = 1000; UPDATE agent &lt; 500 → idsupervisor = 2000.</li>' +
      '<li>SELECT: agent, sname, nrating, idsupervisor, top_filial — 50 строк, сортировка по дате контракта.</li>' +
      '</ol>' +
      '<p style="margin-top:10px;font-size:.88rem;color:#94a3b8">Критерии: работоспособность · комментарии · схема перед таблицами · алиасы в UPDATE/SELECT.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 8,
        hint: 'Пустая строка отделяет блоки — у каждого блока комментарий до или после.',
        check: function (code) {
          var ok = SqlUtil.hasBlockComments(code);
          return { pass: ok, detail: ok ? 'Комментарии у блоков найдены' : 'Добавьте комментарий до или после каждого блока команд' };
        }
      },
      {
        id: 'create_agent',
        label: 'CREATE TABLE Agent с нужными полями',
        weight: 10,
        hint: 'id NUMBER, sLogin VARCHAR2(150), sPassword VARCHAR2(30).',
        check: function (code) {
          var n = SqlUtil.normalize(code);
          var ok = /\bCREATE\s+TABLE\s+\w+\.Agent\s*\(/i.test(n) &&
            /\bid\s+NUMBER\b/i.test(n) &&
            /\bsLogin\s+VARCHAR2\s*\(\s*150(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(n) &&
            /\bsPassword\s+VARCHAR2\s*\(\s*30(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(n);
          return { pass: ok };
        }
      },
      {
        id: 'schema_create_agent',
        label: 'Схема перед Agent при CREATE',
        weight: 6,
        hint: 'Например: student_schema.Agent',
        check: function (code) {
          var ok = /\bCREATE\s+TABLE\s+\w+\.Agent\b/i.test(SqlUtil.normalize(code));
          return { pass: ok };
        }
      },
      {
        id: 'alter_birth',
        label: 'ALTER ADD dBirthDate DATE',
        weight: 8,
        check: function (code) {
          var ok = /\bALTER\s+TABLE\s+[\w.]+\s+ADD\s*\(?\s*dBirthDate\s+DATE\b/i.test(SqlUtil.normalize(code));
          return { pass: ok };
        }
      },
      {
        id: 'drop_not_delete',
        label: 'DROP TABLE (не DELETE FROM)',
        weight: 10,
        hint: 'Нужен DROP TABLE — удаление объекта, а не строк.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var hasDrop = /\bDROP\s+TABLE\s+[\w.]*Agent\b/i.test(norm);
          var hasDelete = /\bDELETE\s+FROM\s+[\w.]*Agent\b/i.test(norm);
          if (hasDelete && !hasDrop) return { pass: false, detail: 'Обнаружен DELETE FROM вместо DROP' };
          return { pass: hasDrop };
        }
      },
      {
        id: 'ctas_agents',
        label: 'CREATE TABLE AGENTS AS SELECT из edu.agents',
        weight: 10,
        check: function (code) {
          var ok = /\bCREATE\s+TABLE\s+[\w.]*AGENTS(?:_?\d+)?\s+AS\s*\(?\s*SELECT\b/i.test(SqlUtil.normalize(code)) &&
            /\bedu\.agents\b/i.test(code);
          return { pass: ok };
        }
      },
      {
        id: 'defaults',
        label: 'ALTER MODIFY — значения по умолчанию (9 полей)',
        weight: 12,
        hint: 'end_date DATE \'2026-01-01\', auto_fix_comm/is_ichp/is_filial/in_premium/lnetwork_develop = \'Y\', top_filial/ichp_old/idrappeltype = 1.',
        check: function (code) {
          var fields = ['end_date', 'auto_fix_comm', 'is_ichp', 'is_filial', 'top_filial', 'in_premium', 'ichp_old', 'idrappeltype', 'lnetwork_develop'];
          var norm = SqlUtil.normalize(code);
          var found = SqlUtil.countDefaultFields(norm, fields);
          return { pass: found.length >= 7, detail: found.length + '/9 полей с DEFAULT' };
        }
      },
      {
        id: 'insert_agent',
        label: 'INSERT агента (seq, nrating=99, begin_date)',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bINSERT\s+INTO\s+[\w.]*AGENTS(?:_?\d+)?\b/i.test(norm) &&
            /edu\.seqEduAgents\.nextval/i.test(code) &&
            /\bnrating\b/i.test(norm) && /\b99\b/.test(norm) &&
            SqlUtil.hasInsertBeginDateSep2025(code, norm);
          return { pass: ok };
        }
      },
      {
        id: 'supervisor_alter',
        label: 'ALTER ADD idsupervisor',
        weight: 5,
        check: function (code) {
          return { pass: /\bALTER\s+TABLE\s+[\w.]*AGENTS(?:_?\d+)?\s+ADD\s*\(?\s*idsupervisor\s+NUMBER\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'supervisor_update_all',
        label: 'UPDATE idsupervisor = 1000 для всех',
        weight: 6,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          return { pass: /\bUPDATE\s+[\w.]+\s+\w+\s+SET\b/i.test(norm) && /\bidsupervisor\s*=\s*1000\b/i.test(norm) };
        }
      },
      {
        id: 'supervisor_update_cond',
        label: 'UPDATE idsupervisor = 2000 WHERE agent < 500',
        weight: 8,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          return { pass: /\bidsupervisor\s*=\s*2000\b/i.test(norm) && /\bagent\s*<\s*500\b/i.test(norm) };
        }
      },
      {
        id: 'schema_second_update',
        label: 'Схема во втором UPDATE (agent < 500)',
        weight: 6,
        hint: 'UPDATE student_schema.agents ag …',
        check: function (code) {
          var stmts = SqlUtil.splitStatements(code);
          var hit = stmts.some(function (s) {
            return /\bidsupervisor\s*=\s*2000\b/i.test(s) && /\bagent\s*<\s*500\b/i.test(s) &&
              /\bUPDATE\s+\w+\.\w+\s+\w+\s+SET\b/i.test(SqlUtil.normalize(s));
          });
          return { pass: hit };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в UPDATE/SELECT',
        weight: 7,
        hint: 'UPDATE agents ag SET ag.col … ; FROM AGENTS ag',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var upd = SqlUtil.hasAnyUpdateAlias(norm);
          var sel = SqlUtil.hasAnySelectAlias(norm);
          return { pass: upd && sel, detail: 'UPDATE alias: ' + upd + ', SELECT alias: ' + sel };
        }
      },
      {
        id: 'final_select',
        label: 'SELECT нужных полей, ORDER BY contract_date, TOP 50',
        weight: 10,
        hint: 'FETCH FIRST 50 ROWS ONLY / ROWNUM <= 50 — с обоснованием в комментарии.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var cols = ['agent', 'sname', 'nrating', 'idsupervisor', 'top_filial'];
          var allCols = cols.every(function (c) { return new RegExp('\\b' + c + '\\b', 'i').test(norm); });
          var order = /\border\s+by\b[\s\S]*\bcontract_date\b/i.test(norm);
          var top50 = SqlUtil.hasTop50Limit(code, norm);
          return { pass: allCols && order && top50, detail: [allCols, order, top50].join('/') };
        }
      },
      {
        id: 'select_fork_comment',
        label: 'Комментарий к трактовке TOP 50 / сортировки',
        weight: 4,
        hint: 'Поясните порядок сортировки и отбора 50 строк.',
        check: function (code) {
          if (!/\bSELECT\b[\s\S]*\bcontract_date\b/i.test(code)) return { pass: false, detail: 'Нет SELECT с contract_date' };
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bSELECT\b/i.test(s) && /\bcontract_date\b/i.test(s);
          }, /50|сорт|sort|fetch|rownum|строк|выборк|order|contract/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к SELECT' };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'select_fork_comment'] },
      { label: 'Схема', ids: ['schema_create_agent', 'schema_second_update'] },
      { label: 'Таблица Agent', ids: ['create_agent', 'alter_birth', 'drop_not_delete'] },
      { label: 'Копирование в AGENTS', ids: ['ctas_agents'] },
      { label: 'Значения по умолчанию', ids: ['defaults'] },
      { label: 'Новая запись', ids: ['insert_agent'] },
      { label: 'idsupervisor', ids: ['supervisor_alter', 'supervisor_update_all', 'supervisor_update_cond'] },
      { label: 'Алиасы', ids: ['aliases'] },
      { label: 'Итоговая выборка', ids: ['final_select'] }
    ]
  },
  {
    id: 'task2_partners',
    title: 'Задание 2 — Partners: копирование и выборка',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка (несколько трактовок, дополнительная команда, выбор подхода) — обязательно поясните её в комментарии в SQL-коде.</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li>Скопируйте таблицу партнёров из <b>edu.partners</b>, но только поля: <b>partner, name, man, agent, admdate</b> (CREATE TABLE … AS SELECT).</li>' +
      '<li>Добавьте партнёра: partner = 1; name = «Тестов Тест Тестович»; man = «Y»; agent = 1000; admdate = текущая дата и время (SYSDATE).</li>' +
      '<li>Удалите все записи из таблицы партнёров (DELETE FROM).</li>' +
      '<li>Проверьте, можно ли вернуть данные (ROLLBACK) — поясните в комментарии.</li>' +
      '<li>SELECT: поля partner, name, man, agent, admdate; верните <b>10% строк</b> из выборки, отсортировав по дате <b>по убыванию</b> (FETCH FIRST 10 PERCENT ROWS ONLY или SAMPLE — с комментарием к выбору).</li>' +
      '</ol>' +
      '<p style="margin-top:10px;font-size:.88rem;color:#94a3b8">Критерии: работоспособность · комментарии · схема перед таблицами · алиасы в SELECT/INSERT/UPDATE.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 8,
        hint: 'Пустая строка отделяет блоки — у каждого блока комментарий до или после.',
        check: function (code) {
          var ok = SqlUtil.hasBlockComments(code);
          return { pass: ok, detail: ok ? 'Комментарии у блоков найдены' : 'Добавьте комментарий до или после каждого блока команд' };
        }
      },
      {
        id: 'schema_create',
        label: 'Схема перед partners при CREATE',
        weight: 8,
        hint: 'Например: student_schema.partners',
        check: function (code) {
          return { pass: /\bCREATE\s+TABLE\s+\w+\.partners(?:_?\d+)?\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'ctas_partners',
        label: 'CREATE TABLE partners AS SELECT нужных полей из edu.partners',
        weight: 14,
        hint: 'partner, name, man, agent, admdate из edu.partners.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var cols = ['partner', 'name', 'man', 'agent', 'admdate'];
          var allCols = cols.every(function (c) { return new RegExp('\\b' + c + '\\b', 'i').test(norm); });
          var ok = /\bCREATE\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+AS\b/i.test(norm) &&
            /\bedu\.partners\b/i.test(code) && allCols;
          return { pass: ok, detail: allCols ? 'Поля найдены' : 'Не все поля' };
        }
      },
      {
        id: 'alter_agent',
        label: 'ALTER MODIFY agent (увеличение VARCHAR2)',
        weight: 8,
        hint: 'agent = 1000 не поместится в VARCHAR2(1) — измените тип.',
        check: function (code) {
          return { pass: /\bALTER\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+MODIFY\b[\s\S]*\bagent\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'insert_partner',
        label: 'INSERT партнёра с нужными значениями',
        weight: 12,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bINSERT\s+INTO\s+[\w.]*partners(?:_?\d+)?\b/i.test(norm) &&
            /\bpartner\b/i.test(norm) && /\b1\b/.test(norm) &&
            /Тестов\s+Тест\s+Тестович/i.test(code) &&
            /\bman\b/i.test(norm) && /'Y'/i.test(code) &&
            /\bagent\b/i.test(norm) && /\b1000\b/.test(norm) &&
            (/\badmdate\b/i.test(norm) && (/\bsysdate\b/i.test(norm) || /\bsystimestamp\b/i.test(norm)));
          return { pass: ok };
        }
      },
      {
        id: 'delete_all',
        label: 'DELETE FROM partners (все записи)',
        weight: 10,
        check: function (code) {
          return { pass: /\bDELETE\s+FROM\s+[\w.]*partners(?:_?\d+)?\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'rollback_comment',
        label: 'Комментарий про ROLLBACK',
        weight: 6,
        hint: 'Поясните, что DELETE можно отменить через ROLLBACK до COMMIT.',
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bDELETE\s+FROM\b/i.test(s);
          }, /rollback|откат|commit|восстанов|вернуть/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий про ROLLBACK' };
        }
      },
      {
        id: 'select_10pct',
        label: 'SELECT 10% строк, ORDER BY admdate DESC',
        weight: 12,
        hint: 'FETCH FIRST 10 PERCENT ROWS ONLY или SAMPLE (10) — с комментарием.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var cols = ['partner', 'name', 'man', 'agent', 'admdate'];
          var allCols = cols.every(function (c) { return new RegExp('\\b' + c + '\\b', 'i').test(norm); });
          var order = /\border\s+by\b[\s\S]*\badmdate\b/i.test(norm) && /\bdesc\b/i.test(norm);
          var pct = SqlUtil.hasSelect10Percent(code, norm);
          return { pass: allCols && order && pct, detail: [allCols, order, pct].join('/') };
        }
      },
      {
        id: 'select_fork_comment',
        label: 'Комментарий к трактовке 10% / SAMPLE',
        weight: 4,
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bSELECT\b/i.test(s) && (/\badmdate\b/i.test(s) || /\b10\s*percent\b/i.test(s) || /\bsample\b/i.test(s));
          }, /10\s*%|sample|fetch|percent|процент|случайн|перв/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к SELECT 10%' };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в SELECT/INSERT',
        weight: 8,
        hint: 'FROM partners p; INSERT INTO schema.partners …',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var sel = SqlUtil.hasAnySelectAlias(norm);
          var ctasM = norm.match(/\bFROM\s+edu\.partners\s+(\w+)\b/i);
          var ctas = ctasM && new RegExp('\\b' + ctasM[1] + '\\.').test(norm);
          var insM = norm.match(/\bINSERT\s+INTO\s+[\w.]*partners(?:_?\d+)?\s+(\w+)\b/i);
          var ins = insM && new RegExp('\\b' + insM[1] + '\\.').test(norm);
          return { pass: sel || ctas || ins, detail: 'SELECT alias: ' + sel + ', CTAS alias: ' + ctas + ', INSERT alias: ' + ins };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'rollback_comment', 'select_fork_comment'] },
      { label: 'Схема', ids: ['schema_create'] },
      { label: 'Копирование partners', ids: ['ctas_partners', 'alter_agent'] },
      { label: 'INSERT и DELETE', ids: ['insert_partner', 'delete_all'] },
      { label: 'Выборка 10%', ids: ['select_10pct'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task3_partnersCopy',
    title: 'Задание 3 — partnersCopy и InsuranceTypes',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка — поясните её в комментарии в SQL-коде.</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li>Создайте <b>partnersCopy</b> на основе <b>edu.claim_claims</b> с доп. столбцом <b>lBlocked</b> (шаблон: CREATE TABLE … AS SELECT ttc.*, CAST(NULL AS VARCHAR2(1)) AS lBlocked FROM …).</li>' +
      '<li>Увеличьте лимит во <b>всех текстовых полях</b> (ALTER TABLE … MODIFY).</li>' +
      '<li>Создайте таблицу <b>InsuranceTypes</b>: id (NUMBER), sname (VARCHAR2 50), sdefault_table_name (VARCHAR2 30). Добавьте <b>5 записей</b> одним оператором (INSERT ALL).</li>' +
      '<li>Добавьте все уникальные виды страхования из <b>i3.products</b> (INSERT … SELECT DISTINCT …). Посмотрите ключи i3.products (View → Keys) и <b>обоснуйте в комментарии</b>, нужен ли DISTINCT.</li>' +
      '<li>Удалите данные из partnersCopy <b>без возможности восстановления</b> (TRUNCATE).</li>' +
      '</ol>' +
      '<p style="margin-top:10px;font-size:.88rem;color:#94a3b8">Критерии: работоспособность · комментарии · схема перед таблицами · алиасы.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'schema_create',
        label: 'Схема перед своими таблицами',
        weight: 8,
        hint: 'Нужна схема перед partnersCopy и InsuranceTypes, например test.InsuranceTypes.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bCREATE\s+TABLE\s+\w+\.partnersCopy\b/i.test(norm) &&
            /\bCREATE\s+TABLE\s+\w+\.Insuran[cs]eTypes\b/i.test(norm);
          return { pass: ok };
        }
      },
      {
        id: 'create_partnersCopy',
        label: 'CREATE partnersCopy из edu.claim_claims + lBlocked',
        weight: 14,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bCREATE\s+TABLE\s+[\w.]*partnersCopy\s+AS\b/i.test(norm) &&
            /\bedu\.claim_claims\b/i.test(code) &&
            /\blBlocked\b/i.test(norm);
          return { pass: ok };
        }
      },
      {
        id: 'modify_text',
        label: 'ALTER MODIFY — увеличение текстовых полей',
        weight: 10,
        hint: 'ALTER TABLE … MODIFY (status, note, …).',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bALTER\s+TABLE\s+[\w.]*partnersCopy\s+MODIFY\b/i.test(norm) &&
            /\b(varchar2|varchar)\s*\(\s*\d+(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(norm);
          return { pass: ok };
        }
      },
      {
        id: 'create_insuranceTypes',
        label: 'CREATE TABLE InsuranceTypes с нужными полями',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bCREATE\s+TABLE\s+[\w.]*Insuran[cs]eTypes\b/i.test(norm) &&
            /\bid\s+NUMBER\b/i.test(norm) &&
            /\bsname\s+VARCHAR2\s*\(\s*50(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(norm) &&
            /\bsdefault_table_name\s+VARCHAR2\s*\(\s*30(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(norm);
          return { pass: ok };
        }
      },
      {
        id: 'insert_all_5',
        label: 'INSERT ALL — 5 записей в InsuranceTypes',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bINSERT\s+ALL\b/i.test(norm) &&
            /\bINTO\s+[\w.]*Insuran[cs]eTypes\b/i.test(norm) &&
            (SqlUtil.countMatches(code, /\bINTO\s+[\w.]*Insuran[cs]eTypes\b/gi) >= 5 ||
              SqlUtil.countMatches(code, /\bINTO\s+[\w.]*insurancetypes\b/gi) >= 5);
          return { pass: ok };
        }
      },
      {
        id: 'insert_products',
        label: 'INSERT из i3.products (уникальные виды страхования)',
        weight: 12,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = (/\bINSERT\s+INTO\s+[\w.]*Insuran[cs]eTypes\b/i.test(norm) ||
              (/\bINSERT\s+ALL\b/i.test(norm) && /\bINTO\s+[\w.]*Insuran[cs]eTypes\b/i.test(norm))) &&
            /\bSELECT\b[\s\S]*\bFROM\s+i3\.products\b/i.test(norm);
          return { pass: ok };
        }
      },
      {
        id: 'distinct_comment',
        label: 'Комментарий про DISTINCT и ключи i3.products',
        weight: 6,
        hint: 'Обоснуйте, нужен ли DISTINCT, исходя из ключей таблицы.',
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bINSERT\b/i.test(s) && /\bi3\.products\b/i.test(s);
          }, /distinct|ключ|key|primary|unique|i3\.products|products/);
          return { pass: ok, detail: ok ? 'Обоснование найдено' : 'Добавьте комментарий про DISTINCT' };
        }
      },
      {
        id: 'truncate',
        label: 'TRUNCATE partnersCopy (без восстановления)',
        weight: 10,
        check: function (code) {
          return { pass: /\bTRUNCATE\s+TABLE\s+[\w.]*partnersCopy\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в SELECT/INSERT',
        weight: 6,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var prodM = norm.match(/\bFROM\s+i3\.products\s+(\w+)\b/i);
          var prod = prodM && new RegExp('\\b' + prodM[1] + '\\.').test(norm);
          var ccM = norm.match(/\bFROM\s+edu\.claim_claims\s+(\w+)\b/i);
          var cc = ccM && new RegExp('\\b' + ccM[1] + '\\.').test(norm);
          var prodQual = /\bi3\.products\s*\.\s*\w+/i.test(code);
          var ccQual = /\bedu\.claim_claims\s*\.\s*\w+/i.test(code) ||
            /\bclaim_claims\s*\.\s*\*/i.test(norm);
          return {
            pass: prod || prodQual || cc || ccQual,
            detail: 'products alias: ' + (prod || prodQual) + ', claim_claims alias: ' + (cc || ccQual)
          };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'distinct_comment'] },
      { label: 'Схема', ids: ['schema_create'] },
      { label: 'partnersCopy', ids: ['create_partnersCopy', 'modify_text'] },
      { label: 'InsuranceTypes', ids: ['create_insuranceTypes', 'insert_all_5', 'insert_products'] },
      { label: 'TRUNCATE', ids: ['truncate'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task4_agents_update',
    title: 'Задание 4 — UPDATE agents и DELETE',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка — поясните её в комментарии в SQL-коде.</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li>UPDATE в вашей копии <b>agents</b>: у агента с самым долгим сроком работы (<b>CONTRACT_DATE</b>) установите <b>AGENCY = 1000</b>.</li>' +
      '<li>Создайте любую таблицу и удалите из неё: <b>все записи</b>; <b>половину</b>; <b>десятую часть</b> записей.</li>' +
      '<li>Удалите в копии <b>agents</b> записи, где <b>agent</b> равен <b>partner</b> из <b>edu.partners</b>.</li>' +
      '</ol>' +
      '<p style="margin-top:10px;font-size:.88rem;color:#94a3b8">Критерии: работоспособность · комментарии · схема перед таблицами · алиасы.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'update_agency',
        label: 'UPDATE AGENCY = 1000 для max CONTRACT_DATE',
        weight: 18,
        hint: 'Подзапрос с MAX(contract_date) или ROW_NUMBER / RANK.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bUPDATE\s+[\w.]*agents(?:_?\d+)?\b/i.test(norm) &&
            /\bagency\s*=\s*1000\b/i.test(norm) &&
            (/\bcontract_date\b/i.test(norm) ||
              /\bmax\s*\(\s*contract_date\s*\)/i.test(norm) ||
              /\brow_number\s*\(\s*\)\s*over\s*\(\s*order\s+by\s+contract_date/i.test(norm) ||
              /\brank\s*\(\s*\)\s*over\s*\(\s*order\s+by\s+contract_date/i.test(norm));
          return { pass: ok };
        }
      },
      {
        id: 'schema_update',
        label: 'Схема в UPDATE agents',
        weight: 8,
        check: function (code) {
          var stmts = SqlUtil.splitStatements(code);
          var hit = stmts.some(function (s) {
            return /\bagency\s*=\s*1000\b/i.test(s) &&
              /\bUPDATE\s+\w+\.\w+\s+\w+\s+SET\b/i.test(SqlUtil.normalize(s));
          });
          return { pass: hit };
        }
      },
      {
        id: 'create_and_deletes',
        label: 'CREATE таблицы + DELETE все / половина / 10%',
        weight: 16,
        hint: 'DELETE без WHERE; DELETE WHERE ROWNUM <= 50%; DELETE WHERE ROWNUM <= 10%.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var hasCreate = /\bCREATE\s+TABLE\s+\w+\.\w+/i.test(norm);
          var deletes = SqlUtil.countMatches(code, /\bDELETE\s+FROM\b/gi);
          var hasHalf = /50\s*%|50\s*percent|\/\s*2|половин|half|0\.5|count\s*\(\s*\*\s*\)\s*\/\s*2/i.test(code);
          var hasTenth = /10\s*%|10\s*percent|десят|count\s*\(\s*\*\s*\)\s*\/\s*10|mod\s*\(|0\.1/i.test(code);
          var ok = hasCreate && deletes >= 3 && hasHalf && hasTenth;
          return { pass: ok, detail: 'CREATE: ' + hasCreate + ', DELETE×' + deletes };
        }
      },
      {
        id: 'delete_agents_match',
        label: 'DELETE agents WHERE agent = edu.partners.partner',
        weight: 14,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bDELETE\s+FROM\s+[\w.]*agents(?:_?\d+)?\b/i.test(norm) &&
            /\bedu\.partners\b/i.test(code) &&
            /\bagent\b/i.test(norm) && /\bpartner\b/i.test(norm) &&
            (/\=\s*[\w.]+\.partner\b/i.test(norm) ||
              /\bin\s*\(\s*select\b[\s\S]*\bpartner\b/i.test(norm) ||
              /\bexists\b[\s\S]*\bpartner\b/i.test(norm) ||
              /\bjoin\b[\s\S]*\bpartner\b/i.test(norm) ||
              /\bany\s*\(\s*select\b[\s\S]*\bpartner\b/i.test(norm));
          return { pass: ok };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в UPDATE/DELETE',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var upd = SqlUtil.hasAnyUpdateAlias(norm);
          var del = SqlUtil.hasAnyDeleteAlias(norm);
          return { pass: upd && del, detail: 'UPDATE alias: ' + upd + ', DELETE alias: ' + del };
        }
      },
      {
        id: 'delete_fork_comment',
        label: 'Комментарий к способу удаления половины / 10%',
        weight: 6,
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bDELETE\s+FROM\b/i.test(s);
          }, /50|10|половин|десят|rownum|percent|%/i);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к DELETE' };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'delete_fork_comment'] },
      { label: 'Схема', ids: ['schema_update'] },
      { label: 'UPDATE agency', ids: ['update_agency'] },
      { label: 'DELETE варианты', ids: ['create_and_deletes'] },
      { label: 'DELETE agents', ids: ['delete_agents_match'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task5_partners_gaps',
    title: 'Задание 5 — Копия partners и нумерация',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка — поясните её в комментарии в SQL-коде.</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li>Скопируйте таблицу партнёров <b>с данными</b> (CREATE TABLE … AS SELECT * FROM edu.partners).</li>' +
      '<li>Проверьте актуальность телефонов. Если данные устарели — добавьте столбец <b>sUsedEmergencyCommunicationType</b> (VARCHAR2 30) и обновите: «Phone» при наличии телефона, «Mail» — если нет.</li>' +
      '<li>Удалите всю таблицу <b>без возможности восстановления</b> (DROP … PURGE).</li>' +
      '<li>Добавьте в копию <b>agents</b> пять записей одним оператором (INSERT ALL).</li>' +
      '<li>UPDATE partner в копии partners: убрать «дыры» в нумерации (1,2,5,6,9 → 1,2,3,4,5). Для всех записей или для 25 — с комментарием.</li>' +
      '</ol>' +
      '<p style="margin-top:10px;font-size:.88rem;color:#94a3b8">Критерии: работоспособность · комментарии · схема перед таблицами · алиасы.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'schema_create',
        label: 'Схема перед своими таблицами',
        weight: 8,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bCREATE\s+TABLE\s+\w+\.\w+/i.test(norm) &&
            (/\bDROP\s+TABLE\s+\w+\.\w+/i.test(norm) || /\bDROP\s+TABLE\s+\w+\.\w+\s+PURGE/i.test(norm));
          return { pass: ok };
        }
      },
      {
        id: 'ctas_partners_full',
        label: 'CREATE TABLE partners AS SELECT * FROM edu.partners',
        weight: 12,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          return { pass: /\bCREATE\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+AS\b/i.test(norm) &&
            /\bedu\.partners\b/i.test(code) &&
            /\bSELECT\b[\s\S]*\bFROM\b/i.test(norm) };
        }
      },
      {
        id: 'add_emergency_col',
        label: 'ALTER ADD sUsedEmergencyCommunicationType VARCHAR2(30)',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          return { pass: /\bALTER\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+ADD\b[\s\S]*\bsUsedEmergencyCommunicationType\b/i.test(norm) &&
            /\bvarchar2\s*\(\s*30(?:\s+(?:CHAR|BYTE))?\s*\)/i.test(norm) };
        }
      },
      {
        id: 'update_phone_mail',
        label: 'UPDATE Phone / Mail по наличию телефона',
        weight: 12,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bUPDATE\s+[\w.]*partners(?:_?\d+)?\b/i.test(norm) &&
            /\bPhone\b/i.test(code) && /\bMail\b/i.test(code) &&
            (/\bphone\b/i.test(norm) || /\btel\b/i.test(norm) || /\bmobile\b/i.test(norm));
          return { pass: ok };
        }
      },
      {
        id: 'drop_purge',
        label: 'DROP TABLE … PURGE (без восстановления)',
        weight: 10,
        check: function (code) {
          return { pass: /\bDROP\s+TABLE\s+[\w.]+\s+PURGE\b/i.test(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'insert_all_agents',
        label: 'INSERT ALL — 5 записей в agents',
        weight: 10,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = /\bINSERT\s+ALL\b/i.test(norm) &&
            /\bINTO\s+[\w.]*agents(?:_?\d+)?\b/i.test(norm) &&
            SqlUtil.countMatches(code, /\bINTO\s+[\w.]*agents(?:_?\d+)?\b/gi) >= 5;
          return { pass: ok };
        }
      },
      {
        id: 'update_partner_gaps',
        label: 'UPDATE partner — убрать пропуски в нумерации',
        weight: 14,
        hint: 'ROW_NUMBER(), DENSE_RANK() или MERGE — с комментарием.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var ok = (/\bUPDATE\s+[\w.]*partners(?:_?\d+)?\b/i.test(norm) || /\bMERGE\s+INTO\s+[\w.]*partners(?:_?\d+)?\b/i.test(norm)) &&
            /\bpartner\b/i.test(norm) &&
            (/\brow_number\b/i.test(norm) || /\bdense_rank\b/i.test(norm) ||
              /\brank\b/i.test(norm) || /\bmerge\b/i.test(norm) ||
              /\brownum\b/i.test(norm));
          return { pass: ok };
        }
      },
      {
        id: 'gaps_comment',
        label: 'Комментарий к перенумерации partner',
        weight: 4,
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bUPDATE\b/i.test(s) && /\bpartner\b/i.test(s);
          }, /25|дыр|пропуск|gap|row_number|dense_rank|нумерац|перенумер/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к UPDATE partner' };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в UPDATE/SELECT',
        weight: 6,
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var upd = SqlUtil.hasAnyUpdateAlias(norm);
          var sel = SqlUtil.hasAnySelectAlias(norm);
          return { pass: upd || sel, detail: 'UPDATE alias: ' + upd + ', SELECT alias: ' + sel };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'gaps_comment'] },
      { label: 'Схема', ids: ['schema_create'] },
      { label: 'Копия partners', ids: ['ctas_partners_full', 'add_emergency_col', 'update_phone_mail'] },
      { label: 'DROP PURGE', ids: ['drop_purge'] },
      { label: 'INSERT ALL agents', ids: ['insert_all_agents'] },
      { label: 'Перенумерация partner', ids: ['update_partner_gaps'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task6_policies_joins',
    title: 'Задание 6 — Реестр полисов: JOIN, UNION, INTERSECT',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка (тип JOIN, UNION vs UNION ALL, добавление тестовых данных) — поясните её в комментарии в SQL-коде.</p>' +
      '<p>Руководству нужен реестр всех действующих (<b>active</b>) страховых полисов. Напишите:</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li><b>а)</b> Запрос, который выведет номер полиса, его продукт, ФИО страхователя (партнёра) и ФИО агента, который его оформил (<b>INNER JOIN</b> или эквивалент).</li>' +
      '<li><b>б)</b> Запрос, который выведет список всех агентов и их полисов <b>policy</b>. Если у агента нет полиса — в столбце с полисом должен быть <b>NULL</b> (<b>LEFT JOIN</b> или синтаксис Oracle <code>(+)</code>).</li>' +
      '<li><b>в)</b> Запрос с <b>UNION</b>, который выведет ФИО всех контрагентов (агенты и клиенты/партнёры).</li>' +
      '<li><b>г)</b> Запрос с <b>INTERSECT</b>, который выведет ФИО страхователя, который является ещё и агентом. Если такого нет — добавьте его (<b>INSERT</b>) и убедитесь, что запрос возвращает не пустое множество.</li>' +
      '</ol>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8"><b>Ожидаемый результат:</b><br>' +
      'а) policy, product, partner_name, agent_name — только полисы со статусом <b>active</b>.<br>' +
      'б) agent_name, Policy — у агентов без полиса Policy = NULL.<br>' +
      'в) одна колонка с ФИО контрагента.<br>' +
      'г) одна колонка с ФИО агента-клиента.</p>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8">Фокус: INNER JOIN, LEFT JOIN, UNION, INTERSECT.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 6,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'q1a_active_policies',
        label: 'а) INNER JOIN — active-полисы с продуктом, партнёром и агентом',
        weight: 18,
        hint: 'JOIN policies + partners + agents; WHERE status = \'active\'. Допустимы запятая+WHERE или INNER JOIN.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return /\bpolic/i.test(n) && /\bproduct/i.test(n) &&
              (/\bpartner/i.test(n) || /\binsur/i.test(n)) && /\bagent/i.test(n) &&
              /\bactive\b/i.test(n) && SqlUtil.hasInnerJoinSyntax(n);
          });
          return { pass: ok, detail: ok ? 'Запрос а) найден' : 'Нужен SELECT с JOIN и фильтром active' };
        }
      },
      {
        id: 'q1b_left_agents',
        label: 'б) LEFT JOIN — все агенты и их полисы (NULL если нет)',
        weight: 18,
        hint: 'FROM agents LEFT JOIN policies … или policies (+).',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return /\bagent/i.test(n) && /\bpolic/i.test(n) &&
              SqlUtil.hasLeftJoinSyntax(n, s);
          });
          return { pass: ok, detail: ok ? 'LEFT JOIN найден' : 'Нужен LEFT JOIN или (+)' };
        }
      },
      {
        id: 'q1c_union_counterparties',
        label: 'в) UNION — ФИО всех контрагентов',
        weight: 16,
        hint: 'SELECT name FROM agents UNION SELECT name FROM partners (или UNION ALL с DISTINCT).',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasUnionSyntax(n) &&
              (/\bagent/i.test(n) || /\bsname\b/i.test(n)) &&
              (/\bpartner/i.test(n) || /\bclient/i.test(n) || (/\bname\b/i.test(n) && /\bUNION\b/i.test(n)));
          });
          return { pass: ok };
        }
      },
      {
        id: 'q1d_intersect',
        label: 'г) INTERSECT — страхователь, который также агент',
        weight: 14,
        hint: 'SELECT … FROM partners INTERSECT SELECT … FROM agents.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            return SqlUtil.hasIntersectSyntax(SqlUtil.normalize(s));
          });
          return { pass: ok, detail: ok ? 'INTERSECT найден' : 'Нужен запрос с INTERSECT' };
        }
      },
      {
        id: 'q1d_insert_overlap',
        label: 'г) INSERT тестового контрагента-агента (если нужен)',
        weight: 8,
        hint: 'Если INTERSECT пуст — INSERT в partners или agents с тем же ФИО.',
        check: function (code) {
          var norm = SqlUtil.normalize(code);
          var hasIntersect = SqlUtil.selectStmts(code).some(function (s) {
            return SqlUtil.hasIntersectSyntax(SqlUtil.normalize(s));
          });
          if (!hasIntersect) return { pass: false, detail: 'Сначала нужен INTERSECT' };
          var hasInsert = /\bINSERT\s+INTO\b/i.test(norm);
          var hasComment = SqlUtil.adjacentCommentMatch(code, function (s) {
            return /\bINSERT\b/i.test(s) || /\bINTERSECT\b/i.test(s);
          }, /intersect|агент|partner|client|добав|insert|пуст|тест|overlap|контрагент/);
          return {
            pass: hasInsert || hasComment,
            detail: hasInsert ? 'INSERT найден' : (hasComment ? 'Пояснение про данные' : 'Добавьте INSERT или комментарий')
          };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в SELECT/JOIN',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasAnySelectAlias(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'join_fork_comment',
        label: 'Комментарий к выбору типа JOIN / UNION',
        weight: 4,
        hint: 'Поясните, если используете (+), запятую+WHERE или UNION ALL.',
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            var n = SqlUtil.normalize(s);
            return /\bSELECT\b/i.test(n) && (/\bJOIN\b/i.test(n) || /\bUNION\b/i.test(n) ||
              /\(\+\)/.test(s) || SqlUtil.hasCommaJoin(n) || SqlUtil.hasIntersectSyntax(n));
          }, /join|union|left|inner|intersect|\(\+\)|запят|comma|distinct|all|алиас/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к JOIN/UNION' };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'join_fork_comment'] },
      { label: 'а) Active-полисы', ids: ['q1a_active_policies'] },
      { label: 'б) LEFT JOIN агенты', ids: ['q1b_left_agents'] },
      { label: 'в) UNION контрагенты', ids: ['q1c_union_counterparties'] },
      { label: 'г) INTERSECT + данные', ids: ['q1d_intersect', 'q1d_insert_overlap'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task7_agents_analytics',
    title: 'Задание 7 — Отчёт по агентам: GROUP BY, AVG, HAVING',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка (HAVING &gt; 1 vs &gt;= 2, подзапрос vs JOIN) — поясните её в комментарии.</p>' +
      '<p>Для оценки эффективности работы составьте отчёт по агентам. Напишите:</p>' +
      '<ol style="margin:8px 0;padding-left:20px;line-height:1.55">' +
      '<li><b>а)</b> Для каждого агента — количество оформленных им <b>активных</b> полисов. Выведите ФИО агента, его рейтинг и количество активных полисов. В отчёт попадают только агенты с <b>более чем одним</b> активным полисом (<b>GROUP BY</b>, <b>COUNT</b>, <b>HAVING</b>).</li>' +
      '<li><b>б)</b> Средний рейтинг всех агентов, у которых продан хотя бы 1 полис (<b>AVG</b>).</li>' +
      '<li><b>в)</b> Запрос с <b>UNION</b>: ФИО контрагентов, у которых есть минимум 2 проданных <i>или</i> 2 купленных полиса.</li>' +
      '</ol>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8"><b>Ожидаемый результат:</b><br>' +
      'а) name, nrating, active_policies_count — только агент с 2 активными полисами.<br>' +
      'б) одна колонка — средний рейтинг агентов, успешно продавших полис.<br>' +
      'в) одна колонка — ФИО контрагента.</p>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8">Фокус: JOIN, GROUP BY, COUNT, AVG, HAVING.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 6,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'q2a_group_having',
        label: 'а) GROUP BY + COUNT + HAVING — агенты с >1 active-полисом',
        weight: 20,
        hint: 'GROUP BY agent/sname, COUNT(*), HAVING COUNT > 1, фильтр active.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return /\bGROUP\s+BY\b/i.test(n) && /\bCOUNT\s*\(/i.test(n) && SqlUtil.hasHavingMin2(n) &&
              /\bactive\b/i.test(n) && (/\bnrating\b/i.test(n) || /\bname\b/i.test(n) || /\bsname\b/i.test(n));
          });
          return { pass: ok, detail: ok ? 'Агрегация с HAVING найдена' : 'Нужны GROUP BY, COUNT, HAVING > 1' };
        }
      },
      {
        id: 'q2a_join_policies',
        label: 'а) Связь agents и policies в запросе а)',
        weight: 8,
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return /\bGROUP\s+BY\b/i.test(n) && /\bHAVING\b/i.test(n) &&
              /\bagent/i.test(n) && /\bpolic/i.test(n) &&
              (/\bJOIN\b/i.test(n) || SqlUtil.hasCommaJoin(n) ||
                /\bWHERE\b[\s\S]*\bagent\b/i.test(n));
          });
          return { pass: ok };
        }
      },
      {
        id: 'q2b_avg_rating',
        label: 'б) AVG(nrating) — агенты с ≥1 проданным полисом',
        weight: 18,
        hint: 'AVG(nrating) WHERE EXISTS/JOIN к policies по agent.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return /\bAVG\s*\(\s*[\w.]*nrating\s*\)/i.test(n) &&
              /\bpolic/i.test(n) && /\bagent/i.test(n);
          });
          return { pass: ok, detail: ok ? 'AVG(nrating) найден' : 'Нужен AVG(nrating) с привязкой к полисам' };
        }
      },
      {
        id: 'q2c_union_min2',
        label: 'в) UNION — контрагенты с ≥2 проданных или ≥2 купленных полисов',
        weight: 18,
        hint: 'Два SELECT с GROUP BY HAVING COUNT >= 2, объединённые UNION.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasUnionSyntax(n) && /\bGROUP\s+BY\b/i.test(n) && SqlUtil.hasHavingMin2(n);
          });
          return { pass: ok };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в SELECT/JOIN',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasAnySelectAlias(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'having_fork_comment',
        label: 'Комментарий к HAVING / AVG / UNION',
        weight: 4,
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            var n = SqlUtil.normalize(s);
            return /\bHAVING\b/i.test(n) || /\bAVG\s*\(/i.test(n) ||
              (/\bUNION\b/i.test(n) && /\bGROUP\s+BY\b/i.test(n));
          }, /having|avg|union|>\s*1|>=\s*2|active|продан|куплен|полис|агент|partner/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к агрегации' };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'having_fork_comment'] },
      { label: 'а) GROUP BY / HAVING', ids: ['q2a_group_having', 'q2a_join_policies'] },
      { label: 'б) AVG рейтинг', ids: ['q2b_avg_rating'] },
      { label: 'в) UNION ≥2 полиса', ids: ['q2c_union_min2'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  },
  {
    id: 'task8_regions_cross',
    title: 'Задание 8 — Регионы: FULL JOIN и CROSS JOIN',
    passScore: 75,
    html: '<p><b>Инструкция.</b> Если в решении есть развилка (FULL JOIN vs UNION пар регионов, CROSS JOIN vs запятая) — поясните её в комментарии.</p>' +
      '<p><b>а) Анализ регионального покрытия.</b> Единый отчёт: все регионы, где есть либо агенты, либо партнёры. Цель — найти регионы с партнёрами без агентов и наоборот (<b>FULL OUTER JOIN</b>).</p>' +
      '<p><b>б) Потенциальные назначения.</b> Список всех возможных пар «Активный партнёр – Агент» в одном регионе (<b>CROSS JOIN</b> + фильтр по региону и status = \'active\' у партнёра).</p>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8"><b>Ожидаемый результат — часть 1:</b> agent_region и partner_region — Москва и СПб (есть и те, и другие); Казань (только агент); Новосибирск (только партнёр).</p>' +
      '<p style="font-size:.88rem;color:#94a3b8"><b>Часть 2:</b> partner_name, agent_name — Москва: 2 комбинации; СПб: 1 комбинация.</p>' +
      '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8">Фокус: FULL OUTER JOIN, CROSS JOIN.</p>',
    rubric: [
      {
        id: 'comments',
        label: 'Комментарии у блоков команд',
        weight: 6,
        check: function (code) {
          return { pass: SqlUtil.hasBlockComments(code) };
        }
      },
      {
        id: 'q3a_full_join_regions',
        label: 'а) FULL OUTER JOIN — регионы агентов и партнёров',
        weight: 22,
        hint: 'FULL JOIN по sregion между agents и partners.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasFullJoinEquiv(n, s) &&
              SqlUtil.hasRegionIdent(n) &&
              /\bagent/i.test(n) && /\bpartner/i.test(n);
          });
          return { pass: ok, detail: ok ? 'FULL JOIN найден' : 'Нужен FULL OUTER JOIN по региону' };
        }
      },
      {
        id: 'q3a_region_columns',
        label: 'а) Колонки agent_region / partner_region (или эквивалент)',
        weight: 8,
        hint: 'Два столбца региона — с агентской и партнёрской стороны.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasFullJoinEquiv(n, s) &&
              ((/\bagent[\w_]*s?region\b/i.test(n) && /\bpartner[\w_]*s?region\b/i.test(n)) ||
                (SqlUtil.hasRegionIdent(n) && /\bagent/i.test(n) && /\bpartner/i.test(n)));
          });
          return { pass: ok };
        }
      },
      {
        id: 'q3b_cross_join_pairs',
        label: 'б) CROSS JOIN — пары активный партнёр × агент в регионе',
        weight: 22,
        hint: 'CROSS JOIN partners × agents WHERE sregion совпадает AND partner.status = active.',
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasCrossJoinSyntax(n) &&
              /\bpartner/i.test(n) && /\bagent/i.test(n) &&
              SqlUtil.hasRegionIdent(n) &&
              /\bactive\b/i.test(n);
          });
          return { pass: ok, detail: ok ? 'CROSS JOIN найден' : 'Нужен CROSS JOIN с фильтром по региону' };
        }
      },
      {
        id: 'q3b_name_columns',
        label: 'б) Колонки partner_name и agent_name',
        weight: 8,
        check: function (code) {
          var ok = SqlUtil.selectStmts(code).some(function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasCrossJoinSyntax(n) &&
              (/\bpartner[\w_]*name\b/i.test(n) || (/\bpartner/i.test(n) && /\bname\b/i.test(n))) &&
              (/\bagent[\w_]*name\b/i.test(n) || (/\bagent/i.test(n) && /\bs?name\b/i.test(n)));
          });
          return { pass: ok };
        }
      },
      {
        id: 'aliases',
        label: 'Алиасы таблиц в SELECT/JOIN',
        weight: 8,
        check: function (code) {
          return { pass: SqlUtil.hasAnySelectAlias(SqlUtil.normalize(code)) };
        }
      },
      {
        id: 'region_fork_comment',
        label: 'Комментарий к FULL JOIN / CROSS JOIN',
        weight: 4,
        hint: 'Поясните выбор FULL JOIN vs UNION, CROSS JOIN vs WHERE region=region.',
        check: function (code) {
          var ok = SqlUtil.adjacentCommentMatch(code, function (s) {
            var n = SqlUtil.normalize(s);
            return SqlUtil.hasFullJoinEquiv(n, s) || SqlUtil.hasCrossJoinSyntax(n);
          }, /full|cross|join|region|регион|union|active|партн|агент|комбинац|декарт/);
          return { pass: ok, detail: ok ? 'Пояснение найдено' : 'Добавьте комментарий к JOIN' };
        }
      }
    ],
    checklist: [
      { label: 'Комментарии', ids: ['comments', 'region_fork_comment'] },
      { label: 'а) FULL JOIN регионы', ids: ['q3a_full_join_regions', 'q3a_region_columns'] },
      { label: 'б) CROSS JOIN пары', ids: ['q3b_cross_join_pairs', 'q3b_name_columns'] },
      { label: 'Алиасы', ids: ['aliases'] }
    ]
  }
];

var PREP_STEP = {
  id: 'prep_create_tables',
  isPrep: true,
  title: 'Подготовка к задачам (create tables)',
  html: '<p><b>Как решать задачи?</b> Сначала создайте и наполните таблицы в своей схеме — без них JOIN-запросы не выполнить.</p>' +
    '<p><b>🦶 Шаг 1.</b> Создай таблицу агентов в своей схеме</p>' +
    '<div class="script-block"><button type="button" class="btn-copy-script">Копировать</button>' +
    '<pre>CREATE TABLE agents (\n' +
    '    agent NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n' +
    '    name VARCHAR2(255) NOT NULL,\n' +
    '    sregion VARCHAR2(100),\n' +
    '    nrating NUMBER(3),\n' +
    '    contract_date DATE);</pre></div>' +
    '<p><b>🦶 Шаг 2.</b> Создай таблицу партнеров (страхователей) в своей схеме</p>' +
    '<div class="script-block"><button type="button" class="btn-copy-script">Копировать</button>' +
    '<pre>CREATE TABLE partners (\n' +
    '    partner NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n' +
    '    name VARCHAR2(255) NOT NULL,\n' +
    '    status VARCHAR2(50),\n' +
    '    sregion VARCHAR2(100),\n' +
    '    contract_date DATE);</pre></div>' +
    '<p><b>🦶 Шаг 3.</b> Создай таблицу полисов в своей схеме</p>' +
    '<div class="script-block"><button type="button" class="btn-copy-script">Копировать</button>' +
    '<pre>CREATE TABLE policies (\n' +
    '    policy NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n' +
    '    pholder NUMBER,\n' +
    '    agent NUMBER,\n' +
    '    product VARCHAR2(100),\n' +
    '    from_date DATE,\n' +
    '    to_date DATE,\n' +
    '    status VARCHAR2(50),\n' +
    '    CONSTRAINT fk_pholder FOREIGN KEY (pholder) REFERENCES partners(partner),\n' +
    '    CONSTRAINT fk_agent FOREIGN KEY (agent) REFERENCES agents(agent));</pre></div>' +
    '<p><b>🦶 Шаг 4.</b> Наполни таблицы данными</p>' +
    '<div class="script-block"><button type="button" class="btn-copy-script">Копировать</button>' +
    '<pre class="script-tall">INSERT INTO agents (name, sregion, nrating, contract_date) VALUES (\'Иванов Иван\', \'Москва\', 85, DATE \'2022-01-15\');\n' +
    'INSERT INTO agents (name, sregion, nrating, contract_date) VALUES (\'Петров Петр\', \'Санкт-Петербург\', 92, DATE \'2021-11-20\');\n' +
    'INSERT INTO agents (name, sregion, nrating, contract_date) VALUES (\'Сидоров Сергей\', \'Москва\', 78, DATE \'2023-03-10\');\n' +
    'INSERT INTO agents (name, sregion, nrating, contract_date) VALUES (\'Кузнецова Ольга\', \'Казань\', 95, DATE \'2022-05-01\');\n' +
    'INSERT INTO partners (name, status, sregion, contract_date) VALUES (\'ООО "Ромашка"\', \'active\', \'Москва\', DATE \'2022-02-01\');\n' +
    'INSERT INTO partners (name, status, sregion, contract_date) VALUES (\'ЗАО "Лютик"\', \'active\', \'Санкт-Петербург\', DATE \'2022-03-15\');\n' +
    'INSERT INTO partners (name, status, sregion, contract_date) VALUES (\'ИП "Волков А.А."\', \'terminated\', \'Москва\', DATE \'2021-06-20\');\n' +
    'INSERT INTO partners (name, status, sregion, contract_date) VALUES (\'АО "Вектор"\', \'active\', \'Новосибирск\', DATE \'2023-01-30\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (1, 1, \'КАСКО\', DATE \'2024-03-01\', DATE \'2025-02-28\', \'active\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (1, 1, \'ОСАГО\', DATE \'2024-05-10\', DATE \'2025-05-09\', \'active\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (2, 1, \'ОСАГО\', DATE \'2021-05-10\', DATE \'2022-05-09\', \'expired\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (2, 2, \'ДМС\', DATE \'2024-01-01\', DATE \'2024-12-31\', \'active\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (3, 1, \'КАСКО\', DATE \'2023-07-20\', DATE \'2024-07-19\', \'expired\');\n' +
    'INSERT INTO policies (pholder, agent, product, from_date, to_date, status) VALUES (2, 3, \'НС\', DATE \'2024-06-15\', DATE \'2025-06-14\', \'active\');\n' +
    'COMMIT;</pre></div>' +
    '<p><b>🦶 Шаг 5.</b> Переходи к решению задач!</p>' +
    '<p style="margin-top:8px;font-size:.88rem;color:#94a3b8">Выполните скрипт в PL/SQL Developer, затем нажмите «К задачам →».</p>'
};

var ACTIVE_TASKS = ALL_TASKS.slice(5);
