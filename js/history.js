/* eslint-disable no-unused-vars */
var History = (function () {
  var KEY = 'plsql_trainer_v1';
  var DRAFT_KEY = 'plsql_trainer_v1_draft';
  var MAX_ATTEMPTS = 100;

  var CRITERION_CATEGORIES = {
    comments: 'comment',
    select_fork_comment: 'comment',
    rollback_comment: 'comment',
    distinct_comment: 'comment',
    delete_fork_comment: 'comment',
    gaps_comment: 'comment',
    schema_create_agent: 'schema',
    schema_second_update: 'schema',
    schema_create: 'schema',
    schema_update: 'schema',
    aliases: 'alias',
    drop_not_delete: 'wrong_command',
    drop_purge: 'wrong_command',
    truncate: 'wrong_command',
    create_agent: 'structure',
    alter_birth: 'structure',
    ctas_agents: 'structure',
    defaults: 'structure',
    ctas_partners: 'structure',
    alter_agent: 'structure',
    create_partnersCopy: 'structure',
    modify_text: 'structure',
    create_insuranceTypes: 'structure',
    ctas_partners_full: 'structure',
    add_emergency_col: 'structure',
    insert_agent: 'data',
    supervisor_alter: 'data',
    insert_partner: 'data',
    insert_all_5: 'data',
    insert_products: 'data',
    insert_all_agents: 'data',
    update_phone_mail: 'data',
    delete_all: 'data',
    supervisor_update_all: 'query_logic',
    supervisor_update_cond: 'query_logic',
    final_select: 'query_logic',
    select_10pct: 'query_logic',
    update_agency: 'query_logic',
    create_and_deletes: 'query_logic',
    delete_agents_match: 'query_logic',
    update_partner_gaps: 'query_logic',
    q1a_active_policies: 'query_logic',
    q1b_left_agents: 'query_logic',
    q1c_union_counterparties: 'query_logic',
    q1d_intersect: 'query_logic',
    q1d_insert_overlap: 'data',
    join_fork_comment: 'comment',
    q2a_group_having: 'query_logic',
    q2a_join_policies: 'query_logic',
    q2b_avg_rating: 'query_logic',
    q2c_union_min2: 'query_logic',
    having_fork_comment: 'comment',
    q3a_full_join_regions: 'query_logic',
    q3a_region_columns: 'query_logic',
    q3b_cross_join_pairs: 'query_logic',
    q3b_name_columns: 'query_logic',
    region_fork_comment: 'comment'
  };

  var CATEGORY_LABELS = {
    comment: 'Комментарии и пояснения',
    schema: 'Схема перед таблицами',
    alias: 'Алиасы таблиц',
    wrong_command: 'Выбор DROP вместо DELETE',
    structure: 'Структура таблиц (CREATE/ALTER)',
    data: 'INSERT и изменение данных',
    query_logic: 'Логика запросов (UPDATE/SELECT)'
  };

  /** Ачивки за уверенные навыки; отзываются при ошибке в той же категории */
  var ACHIEVEMENTS = {
    comment: {
      id: 'comment',
      emoji: '💬',
      rarity: 'common',
      title: 'Голос за кадром',
      desc: 'Оставляете комментарии и поясняете развилки — будущий вы скажет спасибо.'
    },
    schema: {
      id: 'schema',
      emoji: '🏛️',
      rarity: 'rare',
      title: 'Схемопат',
      desc: 'Пишете schema.table там, где Oracle иначе скажет «не знаю такую таблицу».'
    },
    alias: {
      id: 'alias',
      emoji: '🏷️',
      rarity: 'common',
      title: 'Мастер псевдонимов',
      desc: 'UPDATE/SELECT с алиасами (ag.) — код читается, столбцы не путаются.'
    },
    wrong_command: {
      id: 'wrong_command',
      emoji: '⚡',
      rarity: 'rare',
      title: 'Не путать с DELETE',
      desc: 'Таблицу убираете через DROP, а не через DELETE FROM — объекты и строки не смешиваете.'
    },
    structure: {
      id: 'structure',
      emoji: '🏗️',
      rarity: 'rare',
      title: 'Архитектор таблиц',
      desc: 'CREATE/ALTER/CTAS и defaults — каркас базы собираете уверенно.'
    },
    data: {
      id: 'data',
      emoji: '📥',
      rarity: 'common',
      title: 'Данный человек',
      desc: 'INSERT и правки данных попадают в цель: sequence, рейтинги, даты.'
    },
    query_logic: {
      id: 'query_logic',
      emoji: '👑',
      rarity: 'legendary',
      title: 'Логик с FETCH',
      desc: 'UPDATE/SELECT с условиями, сортировкой и TOP — запросы делают то, что задумано.'
    },
    analyst_path: {
      id: 'analyst_path',
      emoji: '🧭',
      rarity: 'common',
      title: 'Путь аналитика',
      desc: 'Ты приступил к практическому тренажёру.'
    },
    streak_2: {
      id: 'streak_2',
      emoji: '⚡',
      rarity: 'rare',
      title: '×2 к мощности',
      desc: 'Сдал 2 задания подряд — серия началась!'
    },
    streak_3: {
      id: 'streak_3',
      emoji: '🧠',
      rarity: 'rare',
      title: '×3 к интеллекту',
      desc: 'Три задания подряд — мыслишь всё увереннее.'
    },
    streak_4: {
      id: 'streak_4',
      emoji: '🔥',
      rarity: 'legendary',
      title: '×4 к точности',
      desc: 'Четыре задания подряд — почти безупречная серия.'
    },
    streak_5: {
      id: 'streak_5',
      emoji: '🚀',
      rarity: 'legendary',
      title: '×5 к мастерству',
      desc: 'Пять заданий подряд — отличная серия!'
    },
    streak_6: {
      id: 'streak_6',
      emoji: '🔗',
      rarity: 'legendary',
      title: '×6 — JOIN-master',
      desc: 'Шесть заданий подряд — JOIN и UNION уже не пугают.'
    },
    streak_7: {
      id: 'streak_7',
      emoji: '📊',
      rarity: 'legendary',
      title: '×7 к аналитике',
      desc: 'Семь заданий подряд — GROUP BY и FULL JOIN на автомате.'
    },
    streak_8: {
      id: 'streak_8',
      emoji: '🏆',
      rarity: 'legendary',
      title: 'Полный зачёт',
      desc: 'Все задания подряд — курс пройден без сбоев!'
    }
  };

  var STREAK_ACH_IDS = ['streak_2', 'streak_3', 'streak_4', 'streak_5', 'streak_6', 'streak_7', 'streak_8'];

  function ensureMeta(data) {
    if (!data.meta) data.meta = {};
    return data;
  }

  function markTrainerStarted() {
    var data = load();
    ensureMeta(data);
    if (data.meta.started) return false;
    var grantAnalyst = data.attempts.length === 0;
    data.meta.started = true;
    data.meta.startedAt = Date.now();
    if (grantAnalyst) data.meta.analystPath = true;
    save(data);
    return grantAnalyst;
  }

  function computeTaskStreak(tasks) {
    var data = load();
    var passed = {};
    data.attempts.forEach(function (a) {
      if (a.pass) passed[a.taskId] = true;
    });
    var streak = 0;
    for (var i = 0; i < tasks.length; i++) {
      if (passed[tasks[i].id]) streak++;
      else break;
    }
    return streak;
  }

  function getSpecialAchievementIds(tasks) {
    var data = load();
    ensureMeta(data);
    var ids = [];
    if (data.meta.analystPath) ids.push('analyst_path');
    var streak = computeTaskStreak(tasks);
    STREAK_ACH_IDS.forEach(function (id, i) {
      if (streak >= i + 2) ids.push(id);
    });
    return ids;
  }

  function getAchievement(id) {
    return ACHIEVEMENTS[id] || null;
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{"attempts":[],"meta":{}}');
    } catch (e) {
      return { attempts: [], meta: {} };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function categorizeCriterion(id) {
    return CRITERION_CATEGORIES[id] || 'other';
  }

  function loadDrafts() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function compressOracleErrors(errors) {
    return (errors || [])
      .filter(function (e) { return e.code !== 'INFO'; })
      .map(function (e) { return { code: e.code, title: e.title }; });
  }

  function addAttempt(taskId, result, codeSnippet) {
    var data = load();
    var code = codeSnippet || '';
    data.attempts.push({
      ts: Date.now(),
      taskId: taskId,
      score: result.score,
      pass: result.pass,
      forced: !!result.forced,
      criteria: result.criteria.map(function (c) {
        return {
          id: c.id,
          label: c.label,
          pass: c.pass,
          category: categorizeCriterion(c.id),
          detail: c.detail || null
        };
      }),
      code: code,
      codeLen: code.length,
      oracleErrors: compressOracleErrors(result.oracleErrors)
    });
    if (data.attempts.length > MAX_ATTEMPTS) {
      data.attempts = data.attempts.slice(-MAX_ATTEMPTS);
    }
    save(data);
    return data;
  }

  function hasAnyPass() {
    return load().attempts.some(function (a) { return a.pass || a.forced; });
  }

  function report(tasks) {
    var data = load();
    var byCategory = {};
    var firstPassGood = {};
    var taskPasses = {};
    var forcedTasks = {};
    var earned = {};

    Object.keys(CATEGORY_LABELS).forEach(function (k) {
      byCategory[k] = { fail: 0, pass: 0 };
      earned[k] = false;
    });

    data.attempts.forEach(function (a) {
      if (a.pass) taskPasses[a.taskId] = true;
      if (a.forced) {
        forcedTasks[a.taskId] = true;
        return;
      }

      var isFirstOnTask = !data.attempts.some(function (x) {
        return x.taskId === a.taskId && x.ts < a.ts;
      });

      var catPass = {};
      var catFail = {};

      (a.criteria || []).forEach(function (c) {
        var cat = c.category || categorizeCriterion(c.id);
        if (!byCategory[cat]) byCategory[cat] = { fail: 0, pass: 0 };
        if (c.pass) {
          byCategory[cat].pass++;
          catPass[cat] = true;
          if (isFirstOnTask) firstPassGood[cat] = (firstPassGood[cat] || 0) + 1;
        } else {
          byCategory[cat].fail++;
          catFail[cat] = true;
        }
      });

      Object.keys(catFail).forEach(function (cat) { earned[cat] = false; });
      Object.keys(catPass).forEach(function (cat) {
        if (!catFail[cat]) earned[cat] = true;
      });
    });

    var achievements = [];
    var growthAreas = [];

    getSpecialAchievementIds(tasks).forEach(function (id) {
      if (ACHIEVEMENTS[id]) achievements.push(ACHIEVEMENTS[id]);
    });

    Object.keys(byCategory).forEach(function (cat) {
      var s = byCategory[cat];
      if (!CATEGORY_LABELS[cat]) return;
      if (earned[cat] && ACHIEVEMENTS[cat]) {
        achievements.push(ACHIEVEMENTS[cat]);
      }
      if (s.fail > 0) {
        growthAreas.push({
          cat: cat,
          label: CATEGORY_LABELS[cat],
          fails: s.fail,
          passes: s.pass
        });
      }
    });

    growthAreas.sort(function (a, b) { return b.fails - a.fails; });

    var firstTryStrengths = Object.keys(firstPassGood)
      .filter(function (cat) { return CATEGORY_LABELS[cat]; })
      .map(function (cat) { return CATEGORY_LABELS[cat]; });

    var forcedList = Object.keys(forcedTasks).map(function (id) {
      var task = (tasks || []).filter(function (t) { return t.id === id; })[0];
      return { id: id, title: task ? task.title : id };
    });

    return {
      attempts: data.attempts.length,
      hasPass: hasAnyPass(),
      taskPasses: taskPasses,
      forcedTasks: forcedList,
      achievements: achievements,
      growthAreas: growthAreas,
      firstTryStrengths: firstTryStrengths
    };
  }

  function buildExportPayload(meta, tasks) {
    var data = load();
    var reportTasks = (typeof ALL_TASKS !== 'undefined') ? ALL_TASKS : tasks;
    var summary = report(reportTasks);
    var taskById = {};
    reportTasks.forEach(function (t) { taskById[t.id] = t; });

    var taskScores = {};
    var taskPassed = {};
    var taskForced = {};
    reportTasks.forEach(function (t) {
      taskScores[t.id] = null;
      taskPassed[t.id] = false;
      taskForced[t.id] = false;
    });

    data.attempts.forEach(function (a) {
      if (taskScores[a.taskId] == null || a.score > taskScores[a.taskId]) {
        taskScores[a.taskId] = a.score;
      }
      if (a.pass) taskPassed[a.taskId] = true;
      if (a.forced) taskForced[a.taskId] = true;
    });

    Object.keys(taskForced).forEach(function (id) {
      if (taskForced[id] && taskPassed[id] !== true) taskPassed[id] = 'forced';
    });

    var tasksDone = Object.keys(taskPassed).filter(function (k) { return taskPassed[k] === true; }).length;
    var hasForced = Object.keys(taskForced).some(function (k) { return taskForced[k]; });

    var attempts = data.attempts.map(function (a, i) {
      var task = taskById[a.taskId] || {};
      return {
        sessionId: meta.sessionId,
        student: meta.student,
        group: meta.group,
        attemptNo: i + 1,
        taskId: a.taskId,
        taskTitle: task.title || a.taskId,
        ts: a.ts,
        score: a.score,
        pass: a.pass,
        forced: !!a.forced,
        codeLen: a.codeLen || (a.code ? a.code.length : 0),
        code: a.code || '',
        criteria: a.criteria || [],
        oracleErrors: a.oracleErrors || [],
        secFromStart: meta.startedAt ? Math.round((a.ts - meta.startedAt) / 1000) : null
      };
    });

    return {
      session: {
        sessionId: meta.sessionId,
        course: meta.courseName || 'PL/SQL Oracle Trainer',
        student: meta.student,
        group: meta.group,
        status: meta.completed
          ? (hasForced ? 'Завершён (есть условные сдачи)' : 'Завершён')
          : 'В процессе',
        startedAt: meta.startedAt,
        finishedAt: meta.finishedAt || null,
        completed: !!meta.completed,
        tasksDone: tasksDone,
        tasksTotal: reportTasks.length,
        totalAttempts: data.attempts.length,
        taskScores: taskScores,
        taskPassed: taskPassed,
        taskForced: taskForced,
        achievements: summary.achievements,
        growthAreas: summary.growthAreas,
        firstTryStrengths: summary.firstTryStrengths,
        drafts: loadDrafts(),
        trainerVersion: (typeof ALL_TASKS !== 'undefined') ? 'v1-join' : 'v1'
      },
      attempts: attempts
    };
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return {
    load: load,
    addAttempt: addAttempt,
    report: report,
    buildExportPayload: buildExportPayload,
    hasAnyPass: hasAnyPass,
    clear: clear,
    markTrainerStarted: markTrainerStarted,
    computeTaskStreak: computeTaskStreak,
    getAchievement: getAchievement,
    CATEGORY_LABELS: CATEGORY_LABELS,
    ACHIEVEMENTS: ACHIEVEMENTS
  };
})();
