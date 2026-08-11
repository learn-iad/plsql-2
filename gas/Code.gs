/**
 * PL/SQL Trainer — Google Apps Script receiver
 *
 * Setup:
 * 1. Create a Google Sheet with two tabs: "Sessions" and "Attempts"
 * 2. Extensions → Apps Script → paste this file
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into js/report.js → REPORT_CONFIG.endpoint
 */

var SESSION_HEADERS = [
  'submittedAt', 'reason', 'sessionId', 'course', 'student', 'group', 'status',
  'startedAt', 'finishedAt', 'totalDuration', 'tasksDone', 'tasksTotal', 'totalAttempts',
  'taskScores', 'taskPassed', 'achievements', 'growthAreas', 'firstTryStrengths',
  'drafts', 'trainerVersion'
];

var ATTEMPT_HEADERS = [
  'sessionId', 'student', 'group', 'attemptNo', 'taskId', 'taskTitle', 'ts',
  'score', 'pass', 'codeLen', 'code', 'criteria', 'oracleErrors', 'secFromStart'
];

function doPost(e) {
  try {
    var p = e.parameter;
    if (!p || !p.sessionId) {
      return ContentService.createTextOutput('missing sessionId');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sessionsSheet = getOrCreateSheet_(ss, 'Sessions', SESSION_HEADERS);
    var attemptsSheet = getOrCreateSheet_(ss, 'Attempts', ATTEMPT_HEADERS);

    sessionsSheet.appendRow([
      p.submittedAt || '',
      p.reason || '',
      p.sessionId || '',
      p.course || '',
      p.student || '',
      p.group || '',
      p.status || '',
      p.startedAt || '',
      p.finishedAt || '',
      p.totalDuration || '',
      Number(p.tasksDone || 0),
      Number(p.tasksTotal || 0),
      Number(p.totalAttempts || 0),
      p.taskScores || '',
      p.taskPassed || '',
      p.achievements || '',
      p.growthAreas || '',
      p.firstTryStrengths || '',
      p.drafts || '',
      p.trainerVersion || ''
    ]);

    if (p.attemptsJson) {
      var attempts = JSON.parse(p.attemptsJson);
      if (Array.isArray(attempts) && attempts.length) {
        var rows = attempts.map(function (a) {
          return [
            a.sessionId || p.sessionId || '',
            a.student || p.student || '',
            a.group || p.group || '',
            Number(a.attemptNo || 0),
            a.taskId || '',
            a.taskTitle || '',
            a.ts || '',
            Number(a.score || 0),
            a.pass === true || a.pass === 'true' ? 'TRUE' : 'FALSE',
            Number(a.codeLen || (a.code ? a.code.length : 0)),
            truncateCode_(a.code || '', 49000),
            JSON.stringify(a.criteria || []),
            JSON.stringify(a.oracleErrors || []),
            a.secFromStart != null ? Number(a.secFromStart) : ''
          ];
        });
        var startRow = attemptsSheet.getLastRow() + 1;
        attemptsSheet.getRange(startRow, 1, rows.length, ATTEMPT_HEADERS.length).setValues(rows);
      }
    }

    try {
      refreshAnalytics_(ss);
    } catch (analyticsErr) {
      // не блокируем приём отчёта из-за ошибки дашборда
    }

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Тренажёр')
    .addItem('Обновить аналитику', 'refreshAnalytics')
    .addToUi();
}

/** Ручное обновление листа «Аналитика» (меню или запуск из редактора). */
function refreshAnalytics() {
  refreshAnalytics_(SpreadsheetApp.getActiveSpreadsheet());
}

function refreshAnalytics_(ss) {
  var sessionsSheet = ss.getSheetByName('Sessions');
  var attemptsSheet = ss.getSheetByName('Attempts');
  if (!sessionsSheet || sessionsSheet.getLastRow() < 2) {
    writeEmptyAnalytics_(ss, 'Нет данных — дождитесь первой отправки из тренажёра.');
    return;
  }

  var sessions = readTable_(sessionsSheet, SESSION_HEADERS.length);
  var attempts = attemptsSheet && attemptsSheet.getLastRow() > 1
    ? readTable_(attemptsSheet, ATTEMPT_HEADERS.length)
    : [];

  var bestSessions = pickBestSessions_(sessions);
  var overview = buildOverview_(bestSessions, attempts);
  var taskStats = buildTaskStats_(attempts, bestSessions);
  var studentStats = buildStudentStats_(bestSessions);

  writeAnalyticsSheet_(ss, overview, taskStats, studentStats);
}

function readTable_(sheet, colCount) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, colCount).getValues();
  return values.filter(function (row) { return row[0] || row[2] || row[4]; });
}

/** Диапазон от (r1,c1) до (r2,c2) включительно — обёртка над getRange. */
function rng_(sheet, r1, c1, r2, c2) {
  return sheet.getRange(r1, c1, r2 - r1 + 1, c2 - c1 + 1);
}

/** Одна «лучшая» сессия на ученика: больше заданий → больше попыток → новее. */
function pickBestSessions_(rows) {
  var byStudent = {};
  rows.forEach(function (row) {
    var key = String(row[4] || '').trim() + '\0' + String(row[5] || '').trim();
    if (!key.trim()) return;
    var cur = byStudent[key];
    if (!cur || sessionRank_(row) > sessionRank_(cur)) {
      byStudent[key] = row;
    }
  });
  return Object.keys(byStudent).map(function (k) { return byStudent[k]; });
}

function sessionRank_(row) {
  var done = Number(row[10] || 0);
  var attempts = Number(row[12] || 0);
  var ts = parseDateTime_(row[0]) || new Date(0);
  return done * 1e12 + attempts * 1e6 + ts.getTime();
}

function buildOverview_(sessions, attempts) {
  var students = sessions.length;
  var completed = 0;
  var totalSec = 0;
  var totalAttempts = 0;
  var scoreSum = 0;
  var scoreCount = 0;

  sessions.forEach(function (row) {
    var done = Number(row[10] || 0);
    var total = Number(row[11] || 0);
    if (total > 0 && done >= total) completed++;
    totalSec += parseDuration_(row[9]);
    totalAttempts += Number(row[12] || 0);
    var scores = safeJsonParse_(row[13], {});
    Object.keys(scores).forEach(function (tid) {
      if (scores[tid] != null && !isNaN(scores[tid])) {
        scoreSum += Number(scores[tid]);
        scoreCount++;
      }
    });
  });

  return {
    students: students,
    completed: completed,
    completionPct: students ? Math.round(completed / students * 100) : 0,
    avgDurationSec: students ? Math.round(totalSec / students) : 0,
    totalAttempts: totalAttempts,
    avgAttempts: students ? Math.round(totalAttempts / students * 10) / 10 : 0,
    avgScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
    totalChecks: attempts.length
  };
}

function buildTaskStats_(attempts, sessions) {
  var byTask = {};
  var studentCount = sessions.length || 1;

  attempts.forEach(function (row) {
    var taskId = String(row[4] || '');
    var title = String(row[5] || taskId);
    if (!taskId) return;
    if (!byTask[taskId]) {
      byTask[taskId] = {
        taskId: taskId,
        title: title,
        scores: [],
        attempts: 0,
        passedStudents: {},
        attemptsToPass: [],
        timeOnPass: []
      };
    }
    var t = byTask[taskId];
    t.attempts++;
    t.scores.push(Number(row[7] || 0));
    if (row[8] === true || row[8] === 'TRUE') {
      var sk = String(row[1] || '') + '\0' + String(row[2] || '');
      if (!t.passedStudents[sk]) {
        t.passedStudents[sk] = true;
        t.attemptsToPass.push(Number(row[3] || 1));
        if (row[13] !== '' && row[13] != null) t.timeOnPass.push(Number(row[13]));
      }
    }
  });

  var list = Object.keys(byTask).map(function (id) {
    var t = byTask[id];
    var avgScore = t.scores.length
      ? Math.round(t.scores.reduce(function (a, b) { return a + b; }, 0) / t.scores.length)
      : 0;
    var passCount = Object.keys(t.passedStudents).length;
    var passPct = Math.round(passCount / studentCount * 100);
    var avgAttempts = t.attemptsToPass.length
      ? Math.round(t.attemptsToPass.reduce(function (a, b) { return a + b; }, 0) / t.attemptsToPass.length * 10) / 10
      : 0;
    var avgTimeMin = t.timeOnPass.length
      ? Math.round(t.timeOnPass.reduce(function (a, b) { return a + b; }, 0) / t.timeOnPass.length / 60 * 10) / 10
      : 0;
    var difficulty = Math.round((100 - passPct) * 0.5 + avgAttempts * 15 + (100 - avgScore) * 0.3);
    return {
      title: t.title,
      avgScore: avgScore,
      passPct: passPct,
      avgAttempts: avgAttempts,
      avgTimeMin: avgTimeMin,
      totalAttempts: t.attempts,
      difficulty: difficulty
    };
  });

  list.sort(function (a, b) { return b.difficulty - a.difficulty; });
  return list;
}

function buildStudentStats_(sessions) {
  var list = sessions.map(function (row) {
    var done = Number(row[10] || 0);
    var total = Number(row[11] || 0);
    var scores = safeJsonParse_(row[13], {});
    var passed = safeJsonParse_(row[14], {});
    var scoreVals = Object.keys(scores).map(function (k) { return scores[k]; }).filter(function (v) { return v != null; });
    var avgScore = scoreVals.length
      ? Math.round(scoreVals.reduce(function (a, b) { return a + b; }, 0) / scoreVals.length)
      : 0;
    var passedCount = Object.keys(passed).filter(function (k) { return passed[k]; }).length;
    var successPct = total ? Math.round(done / total * 100) : 0;

    return {
      student: String(row[4] || ''),
      group: String(row[5] || ''),
      status: String(row[6] || ''),
      tasksDone: done,
      tasksTotal: total,
      successPct: successPct,
      passedCount: passedCount,
      totalAttempts: Number(row[12] || 0),
      duration: String(row[9] || '—'),
      durationSec: parseDuration_(row[9]),
      avgScore: avgScore,
      submittedAt: String(row[0] || ''),
      completed: total > 0 && done >= total
    };
  });

  list.sort(function (a, b) {
    if (b.successPct !== a.successPct) return b.successPct - a.successPct;
    return b.avgScore - a.avgScore;
  });
  return list;
}

function writeEmptyAnalytics_(ss, message) {
  var sheet = getOrCreateAnalyticsSheet_(ss);
  clearCharts_(sheet);
  sheet.clear();
  sheet.getRange(1, 1).setValue('Аналитика PL/SQL тренажёра').setFontSize(14).setFontWeight('bold');
  sheet.getRange(3, 1).setValue(message).setFontStyle('italic');
  sheet.setColumnWidth(1, 320);
}

function writeAnalyticsSheet_(ss, overview, taskStats, studentStats) {
  var sheet = getOrCreateAnalyticsSheet_(ss);
  clearCharts_(sheet);
  sheet.clear();

  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');

  rng_(sheet, 1, 1, 1, 8).merge()
    .setValue('Аналитика PL/SQL тренажёра')
    .setFontSize(14).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  sheet.getRange(2, 1).setValue('Обновлено: ' + now).setFontStyle('italic').setFontColor('#5f6368');

  // —— KPI ——
  sheet.getRange(4, 1).setValue('Сводка').setFontWeight('bold').setFontSize(11);
  var kpiHeaders = ['Учеников', 'Завершили курс', '% завершения', 'Ср. время', 'Всего попыток', 'Ср. попыток', 'Ср. балл', 'Проверок'];
  var kpiValues = [
    overview.students,
    overview.completed,
    overview.completionPct + '%',
    formatDurationSec_(overview.avgDurationSec),
    overview.totalAttempts,
    overview.avgAttempts,
    overview.avgScore,
    overview.totalChecks
  ];
  rng_(sheet, 5, 1, 5, 8).setValues([kpiHeaders]).setFontWeight('bold').setBackground('#e8f0fe');
  rng_(sheet, 6, 1, 6, 8).setValues([kpiValues]).setBackground('#f8f9fa');

  // —— Задания ——
  var taskStart = 8;
  sheet.getRange(taskStart, 1).setValue('Сложность заданий (сверху — труднее)').setFontWeight('bold');
  var taskHeaders = ['Задание', 'Ср. балл', '% сдачи', 'Ср. попыток до сдачи', 'Ср. время (мин)', 'Всего попыток', 'Индекс сложности'];
  rng_(sheet, taskStart + 1, 1, taskStart + 1, taskHeaders.length).setValues([taskHeaders])
    .setFontWeight('bold').setBackground('#fce8e6');
  if (taskStats.length) {
    var taskRows = taskStats.map(function (t) {
      return [t.title, t.avgScore, t.passPct / 100, t.avgAttempts, t.avgTimeMin, t.totalAttempts, t.difficulty];
    });
    var taskDataEnd = taskStart + 1 + taskRows.length;
    rng_(sheet, taskStart + 2, 1, taskDataEnd, taskHeaders.length).setValues(taskRows);
    rng_(sheet, taskStart + 2, 3, taskDataEnd, 3).setNumberFormat('0%');
  } else {
    sheet.getRange(taskStart + 2, 1).setValue('Нет попыток на листе Attempts').setFontStyle('italic');
  }

  // —— Ученики ——
  var studStart = taskStart + 2 + Math.max(taskStats.length, 1) + 2;
  sheet.getRange(studStart, 1).setValue('Статистика по ученикам').setFontWeight('bold');
  var studHeaders = ['Ученик', 'Группа', 'Статус', 'Заданий', '% успеха', 'Сдано', 'Попыток', 'Время', 'Ср. балл', 'Последняя отправка'];
  rng_(sheet, studStart + 1, 1, studStart + 1, studHeaders.length).setValues([studHeaders])
    .setFontWeight('bold').setBackground('#e6f4ea');
  if (studentStats.length) {
    var studRows = studentStats.map(function (s) {
      return [
        s.student, s.group, s.status,
        s.tasksDone + ' / ' + s.tasksTotal,
        s.successPct / 100,
        s.passedCount,
        s.totalAttempts,
        s.duration,
        s.avgScore,
        s.submittedAt
      ];
    });
    var studDataEnd = studStart + 1 + studRows.length;
    rng_(sheet, studStart + 2, 1, studDataEnd, studHeaders.length).setValues(studRows);
    rng_(sheet, studStart + 2, 5, studDataEnd, 5).setNumberFormat('0%');
    var doneRange = rng_(sheet, studStart + 2, 5, studDataEnd, 5);
    sheet.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThanOrEqualTo(1).setBackground('#b7e1cd').setRanges([doneRange]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(0.5).setBackground('#f4c7c3').setRanges([doneRange]).build()
    ]);
  }

  // —— Графики ——
  if (taskStats.length >= 1) {
    var chartDataStart = taskStart + 2;
    var chartDataEnd = taskStart + 1 + taskStats.length;

    var passChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(rng_(sheet, chartDataStart, 1, chartDataEnd, 1))
      .addRange(rng_(sheet, chartDataStart, 3, chartDataEnd, 3))
      .setOption('title', '% сдачи по заданиям')
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { slantedText: true, slantedTextAngle: 45 })
      .setOption('colors', ['#34a853'])
      .setPosition(2, 10, 0, 0)
      .setOption('width', 480)
      .setOption('height', 300)
      .build();
    sheet.insertChart(passChart);

    var scoreChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(rng_(sheet, chartDataStart, 1, chartDataEnd, 1))
      .addRange(rng_(sheet, chartDataStart, 2, chartDataEnd, 2))
      .setOption('title', 'Средний балл по заданиям')
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { slantedText: true, slantedTextAngle: 45 })
      .setOption('colors', ['#1a73e8'])
      .setPosition(2, 16, 0, 0)
      .setOption('width', 480)
      .setOption('height', 300)
      .build();
    sheet.insertChart(scoreChart);

    var diffChart = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(rng_(sheet, chartDataStart, 1, chartDataEnd, 1))
      .addRange(rng_(sheet, chartDataStart, 7, chartDataEnd, 7))
      .setOption('title', 'Индекс сложности заданий')
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#ea4335'])
      .setPosition(18, 10, 0, 0)
      .setOption('width', 480)
      .setOption('height', 280)
      .build();
    sheet.insertChart(diffChart);
  }

  if (studentStats.length >= 1) {
    var pieRow = studStart + 1;
    sheet.getRange(pieRow, 12).setValue('Статус');
    sheet.getRange(pieRow, 13).setValue('Кол-во');
    var completedN = studentStats.filter(function (s) { return s.completed; }).length;
    var inProgressN = studentStats.length - completedN;
    rng_(sheet, pieRow + 1, 12, pieRow + 2, 13).setValues([
      ['Завершили', completedN],
      ['В процессе', inProgressN]
    ]);
    var pieChart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(rng_(sheet, pieRow, 12, pieRow + 2, 13))
      .setOption('title', 'Прохождение курса')
      .setOption('colors', ['#34a853', '#fbbc04'])
      .setPosition(18, 16, 0, 0)
      .setOption('width', 400)
      .setOption('height', 280)
      .build();
    sheet.insertChart(pieChart);

    if (studentStats.length <= 25) {
      var studChartStart = studStart + 2;
      var studChartEnd = studStart + 1 + studentStats.length;
      var successChart = sheet.newChart()
        .setChartType(Charts.ChartType.BAR)
        .addRange(rng_(sheet, studChartStart, 1, studChartEnd, 1))
        .addRange(rng_(sheet, studChartStart, 5, studChartEnd, 5))
        .setOption('title', '% успеха по ученикам')
        .setOption('legend', { position: 'none' })
        .setOption('colors', ['#673ab7'])
        .setPosition(studStart + 2 + studentStats.length + 2, 10, 0, 0)
        .setOption('width', 700)
        .setOption('height', Math.min(400, 80 + studentStats.length * 22))
        .build();
      sheet.insertChart(successChart);
    }
  }

  sheet.setFrozenRows(2);
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidths(2, 9, 100);
  sheet.autoResizeColumns(10, 3);
}

function getOrCreateAnalyticsSheet_(ss) {
  var name = 'Аналитика';
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // лист с данными — первым, аналитика — на виду
    ss.setActiveSheet(sheet);
  }
  return sheet;
}

function clearCharts_(sheet) {
  sheet.getCharts().forEach(function (c) { sheet.removeChart(c); });
}

function parseDuration_(s) {
  if (!s) return 0;
  s = String(s);
  var min = s.match(/(\d+)\s*мин/);
  var sec = s.match(/(\d+)\s*сек/);
  return (min ? parseInt(min[1], 10) * 60 : 0) + (sec ? parseInt(sec[1], 10) : 0);
}

function formatDurationSec_(sec) {
  if (!sec || sec < 0) return '0 сек';
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return (m > 0 ? m + ' мин ' : '') + s + ' сек';
}

function parseDateTime_(s) {
  if (!s) return null;
  var m = String(s).match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
}

function safeJsonParse_(s, fallback) {
  try {
    return JSON.parse(s || '');
  } catch (e) {
    return fallback;
  }
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function truncateCode_(code, maxLen) {
  if (!code || code.length <= maxLen) return code;
  return code.slice(0, maxLen) + '\n\n[truncated, total ' + code.length + ' chars]';
}
