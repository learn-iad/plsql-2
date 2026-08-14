/* eslint-disable no-unused-vars */
var CriterionLocator = (function () {
  function stmts(code, pred) {
    return SqlUtil.stmtLineRanges(code, pred);
  }

  function firstOrAll(code, re) {
    var found = stmts(code, function (t) { return re.test(SqlUtil.normalize(t)); });
    return found.length ? found : [];
  }

  function forkComment(code, stmtPred, commentRe) {
    return SqlUtil.locateStmtsMissingAdjacentComment(code, stmtPred, commentRe);
  }

  function schemaMissing(code, stmtRe) {
    return stmts(code, function (t) {
      var n = SqlUtil.normalize(t);
      return stmtRe.test(n) && !/\b(?:CREATE|ALTER|DROP|UPDATE|DELETE|INSERT|TRUNCATE)\s+\w+\.\w+/i.test(n);
    });
  }

  function selectMissingAlias(code) {
    return stmts(code, function (t) {
      var n = SqlUtil.normalize(t);
      return /\bSELECT\b/i.test(n) && /\bFROM\b/i.test(n) && !/\bFROM\s+[\w.]+\s+(\w+)\b[\s\S]*\b\1\./i.test(n);
    });
  }

  function updateMissingAlias(code) {
    return stmts(code, function (t) {
      var n = SqlUtil.normalize(t);
      if (!/\bUPDATE\b/i.test(n)) return false;
      var m = n.match(/\bUPDATE\s+[\w.]+\s+(\w+)\s+SET\b/i);
      return !m || !new RegExp('\\b' + m[1] + '\\.').test(n);
    });
  }

  function deleteMissingAlias(code) {
    return stmts(code, function (t) {
      var n = SqlUtil.normalize(t);
      if (!/\bDELETE\s+FROM\b/i.test(n)) return false;
      return !SqlUtil.hasAnyDeleteAlias(n);
    });
  }

  function selectPred(pred) {
    return function (code) {
      return SqlUtil.stmtLineRanges(code, function (t) {
        return /\bSELECT\b/i.test(t) && pred(SqlUtil.normalize(t), t);
      });
    };
  }

  var locators = {
    comments: function (code) { return SqlUtil.locateBlocksMissingComments(code); },

    select_fork_comment: function (code) {
      return forkComment(code, function (s) {
        return /\bSELECT\b/i.test(s) && (
          /\bcontract_date\b/i.test(s) || /\badmdate\b/i.test(s) ||
          /\b10\s*percent\b/i.test(s) || /\bsample\b/i.test(s)
        );
      }, /50|сорт|sort|fetch|rownum|строк|выборк|order|contract|10\s*%|sample|percent|процент|случайн|перв|admdate/);
    },
    rollback_comment: function (code) {
      return forkComment(code, function (s) { return /\bDELETE\s+FROM\b/i.test(s); },
        /rollback|откат|commit|восстанов|вернуть/);
    },
    distinct_comment: function (code) {
      return forkComment(code, function (s) { return /\bINSERT\b/i.test(s) && /\bi3\.products\b/i.test(s); },
        /distinct|ключ|key|primary|unique|i3\.products|products/);
    },
    delete_fork_comment: function (code) {
      return forkComment(code, function (s) { return /\bDELETE\s+FROM\b/i.test(s); },
        /50|10|половин|десят|rownum|percent|%/);
    },
    gaps_comment: function (code) {
      return forkComment(code, function (s) { return /\bUPDATE\b/i.test(s) && /\bpartner\b/i.test(s); },
        /25|дыр|пропуск|gap|row_number|dense_rank|нумерац|перенумер/);
    },
    join_fork_comment: function (code) {
      return forkComment(code, function (s) {
        var n = SqlUtil.normalize(s);
        return /\bSELECT\b/i.test(n) && (/\bJOIN\b/i.test(n) || /\bUNION\b/i.test(n) ||
          /\(\+\)/.test(s) || SqlUtil.hasCommaJoin(n) || SqlUtil.hasIntersectSyntax(n));
      }, /join|union|left|inner|intersect|\(\+\)|запят|comma|distinct|all|алиас/);
    },
    having_fork_comment: function (code) {
      return forkComment(code, function (s) {
        var n = SqlUtil.normalize(s);
        return /\bHAVING\b/i.test(n) || /\bAVG\s*\(/i.test(n) ||
          (/\bUNION\b/i.test(n) && /\bGROUP\s+BY\b/i.test(n));
      }, /having|avg|union|>\s*1|>=\s*2|active|продан|куплен|полис|агент|partner/);
    },
    region_fork_comment: function (code) {
      return forkComment(code, function (s) {
        var n = SqlUtil.normalize(s);
        return SqlUtil.hasFullJoinEquiv(n, s) || SqlUtil.hasCrossJoinSyntax(n);
      }, /full|cross|join|region|регион|union|active|партн|агент|комбинац|декарт/);
    },

    schema_create_agent: function (code) {
      var r = schemaMissing(code, /\bCREATE\s+TABLE\s+[\w.]*Agent\b/i);
      return r.length ? r : firstOrAll(code, /\bCREATE\s+TABLE\b/i);
    },
    schema_second_update: function (code) {
      return stmts(code, function (t) {
        var n = SqlUtil.normalize(t);
        return /\bidsupervisor\s*=\s*2000\b/i.test(n) && /\bagent\s*<\s*500\b/i.test(n) &&
          !/\bUPDATE\s+\w+\.\w+\s+\w+\s+SET\b/i.test(n);
      });
    },
    schema_create: function (code) {
      return stmts(code, function (t) {
        var n = SqlUtil.normalize(t);
        return /\bCREATE\s+TABLE\b/i.test(n) && (
          !/\bCREATE\s+TABLE\s+\w+\.\w+/i.test(n) ||
          /\bpartnersCopy\b/i.test(n) || /\bInsuran[cs]eTypes\b/i.test(t)
        );
      });
    },
    schema_update: function (code) {
      return stmts(code, function (t) {
        var n = SqlUtil.normalize(t);
        return /\bagency\s*=\s*1000\b/i.test(n) && !/\bUPDATE\s+\w+\.\w+\s+\w+\s+SET\b/i.test(n);
      });
    },

    create_agent: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*Agent\b/i); },
    alter_birth: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\b[\s\S]*\bdBirthDate\b/i); },
    drop_not_delete: function (code) {
      var del = firstOrAll(code, /\bDELETE\s+FROM\s+[\w.]*Agent\b/i);
      if (del.length) return del;
      return firstOrAll(code, /\bDROP\s+TABLE\b/i);
    },
    ctas_agents: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*AGENTS(?:_?\d+)?\s+AS\b/i); },
    defaults: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\b[\s\S]*\bDEFAULT\b/i); },
    insert_agent: function (code) { return firstOrAll(code, /\bINSERT\s+INTO\s+[\w.]*AGENTS(?:_?\d+)?\b/i); },
    supervisor_alter: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\s+[\w.]*AGENTS(?:_?\d+)?\s+ADD\b[\s\S]*\bidsupervisor\b/i); },
    supervisor_update_all: function (code) { return firstOrAll(code, /\bUPDATE\b[\s\S]*\bidsupervisor\s*=\s*1000\b/i); },
    supervisor_update_cond: function (code) { return firstOrAll(code, /\bUPDATE\b[\s\S]*\bidsupervisor\s*=\s*2000\b/i); },
    final_select: function (code) { return firstOrAll(code, /\bSELECT\b[\s\S]*\bcontract_date\b/i); },

    ctas_partners: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+AS\b/i); },
    alter_agent: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+MODIFY\b/i); },
    insert_partner: function (code) { return firstOrAll(code, /\bINSERT\s+INTO\s+[\w.]*partners(?:_?\d+)?\b/i); },
    delete_all: function (code) { return firstOrAll(code, /\bDELETE\s+FROM\s+[\w.]*partners(?:_?\d+)?\b/i); },
    select_10pct: function (code) { return firstOrAll(code, /\bSELECT\b[\s\S]*\badmdate\b/i); },

    create_partnersCopy: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*partnersCopy\s+AS\b/i); },
    modify_text: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\s+[\w.]*partnersCopy\s+MODIFY\b/i); },
    create_insuranceTypes: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*Insuran[cs]eTypes\b/i); },
    insert_all_5: function (code) { return firstOrAll(code, /\bINSERT\s+ALL\b/i); },
    insert_products: function (code) { return firstOrAll(code, /\bINSERT\b[\s\S]*\bi3\.products\b/i); },
    truncate: function (code) { return firstOrAll(code, /\bTRUNCATE\s+TABLE\s+[\w.]*partnersCopy\b/i); },

    update_agency: function (code) { return firstOrAll(code, /\bUPDATE\s+[\w.]*agents(?:_?\d+)?\b/i); },
    create_and_deletes: function (code) {
      var r = firstOrAll(code, /\bCREATE\s+TABLE\b/i);
      if (r.length) return r.concat(stmts(code, function (t) { return /\bDELETE\s+FROM\b/i.test(SqlUtil.normalize(t)); }));
      return stmts(code, function (t) { return /\bDELETE\s+FROM\b/i.test(SqlUtil.normalize(t)); });
    },
    delete_agents_match: function (code) { return firstOrAll(code, /\bDELETE\s+FROM\s+[\w.]*agents(?:_?\d+)?\b/i); },

    ctas_partners_full: function (code) { return firstOrAll(code, /\bCREATE\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+AS\b/i); },
    add_emergency_col: function (code) { return firstOrAll(code, /\bALTER\s+TABLE\s+[\w.]*partners(?:_?\d+)?\s+ADD\b/i); },
    update_phone_mail: function (code) { return firstOrAll(code, /\bUPDATE\s+[\w.]*partners(?:_?\d+)?\b/i); },
    drop_purge: function (code) { return firstOrAll(code, /\bDROP\s+TABLE\b/i); },
    insert_all_agents: function (code) { return firstOrAll(code, /\bINSERT\s+ALL\b/i); },
    update_partner_gaps: function (code) { return firstOrAll(code, /\b(?:UPDATE|MERGE)\s+[\w.]*partners(?:_?\d+)?\b/i); },

    q1a_active_policies: selectPred(function (n) {
      return /\bpolic/i.test(n) && (/\bpartner/i.test(n) || /\bagent/i.test(n));
    }),
    q1b_left_agents: selectPred(function (n, raw) {
      return /\bagent/i.test(n) && /\bpolic/i.test(n);
    }),
    q1c_union_counterparties: selectPred(function (n) {
      return SqlUtil.hasUnionSyntax(n) || (/\bagent/i.test(n) && /\bpartner/i.test(n));
    }),
    q1d_intersect: selectPred(function (n) { return SqlUtil.hasIntersectSyntax(n) || (/\bagent/i.test(n) && /\bpartner/i.test(n)); }),
    q1d_insert_overlap: function (code) {
      var ins = firstOrAll(code, /\bINSERT\s+INTO\b/i);
      if (ins.length) return ins;
      return selectPred(function (n) { return SqlUtil.hasIntersectSyntax(n); })(code);
    },

    q2a_group_having: selectPred(function (n) {
      return /\bGROUP\s+BY\b/i.test(n) || /\bHAVING\b/i.test(n);
    }),
    q2a_join_policies: selectPred(function (n) {
      return (/\bGROUP\s+BY\b/i.test(n) || /\bHAVING\b/i.test(n)) &&
        (/\bagent/i.test(n) || /\bpolic/i.test(n));
    }),
    q2b_avg_rating: selectPred(function (n) {
      return /\bAVG\s*\(/i.test(n) || (/\bnrating\b/i.test(n) && /\bpolic/i.test(n));
    }),
    q2c_union_min2: selectPred(function (n) {
      return SqlUtil.hasUnionSyntax(n) || (/\bGROUP\s+BY\b/i.test(n) && /\bHAVING\b/i.test(n));
    }),

    q3a_full_join_regions: selectPred(function (n, raw) {
      return SqlUtil.hasFullJoinEquiv(n, raw) ||
        (/\bagent/i.test(n) && /\bpartner/i.test(n) && SqlUtil.hasRegionIdent(n));
    }),
    q3a_region_columns: selectPred(function (n) {
      return SqlUtil.hasRegionIdent(n);
    }),
    q3b_cross_join_pairs: selectPred(function (n) {
      return SqlUtil.hasCrossJoinSyntax(n) ||
        (/\bpartner/i.test(n) && /\bagent/i.test(n) && SqlUtil.hasRegionIdent(n));
    }),
    q3b_name_columns: selectPred(function (n) {
      return SqlUtil.hasCrossJoinSyntax(n) && /\bs?name\b/i.test(n);
    }),

    aliases: function (code) {
      return selectMissingAlias(code)
        .concat(updateMissingAlias(code))
        .concat(deleteMissingAlias(code));
    }
  };

  function mergeRanges(ranges) {
    if (!ranges.length) return [];
    var sorted = ranges.slice().sort(function (a, b) { return a.start - b.start; });
    var out = [sorted[0]];
    for (var i = 1; i < sorted.length; i++) {
      var last = out[out.length - 1];
      var cur = sorted[i];
      if (cur.start <= last.end + 1) {
        last.end = Math.max(last.end, cur.end);
      } else {
        out.push({ start: cur.start, end: cur.end });
      }
    }
    return out;
  }

  function locate(code, id) {
    var fn = locators[id];
    return fn ? fn(code) : [];
  }

  function locateFailed(code, ids, criteria) {
    var byId = {};
    criteria.forEach(function (c) { byId[c.id] = c; });
    var out = [];
    ids.forEach(function (id) {
      var c = byId[id];
      if (c && !c.pass) out = out.concat(locate(code, id));
    });
    return mergeRanges(out);
  }

  function rangesToLineSet(ranges) {
    var set = {};
    ranges.forEach(function (r) {
      for (var ln = r.start; ln <= r.end; ln++) set[ln] = true;
    });
    return set;
  }

  return { locate: locate, locateFailed: locateFailed, rangesToLineSet: rangesToLineSet };
})();
