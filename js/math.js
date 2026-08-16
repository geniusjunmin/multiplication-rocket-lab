/**
 * Multiplication Rocket Lab - Adaptive Learning & Math Engine (js/math.js)
 * Supports 1x1 to 12x12 tables, UK Presets, Fact-Level Mastery Tracking & Spaced Repetition
 */
class MathEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.selectedTables = [2, 3, 4, 5];
    this.wrongQuestionQueue = [];
    this.lastServedFactKey = null;
    this.recentFactHistory = [];
  }

  setTables(tables) {
    if (Array.isArray(tables) && tables.length > 0) {
      this.selectedTables = tables.filter(t => t >= 1 && t <= 12);
    } else {
      this.selectedTables = [2, 3, 4, 5];
    }
  }

  getFactKey(a, b) {
    return `${a}x${b}`;
  }

  getFactRecord(a, b) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const key = this.getFactKey(a, b);
    if (profile && profile.facts && profile.facts[key]) {
      return profile.facts[key];
    }
    return {
      id: key,
      factorA: a,
      factorB: b,
      answer: a * b,
      attempts: 0,
      firstTryCorrect: 0,
      wrongCount: 0,
      averageResponseTime: 0,
      streak: 0,
      masteryScore: 0,
      lastAnsweredAt: null,
      lastWrongAt: null
    };
  }

  /**
   * Calculate mastery score (0 ~ 100)
   */
  calculateMastery(fact) {
    if (!fact || fact.attempts === 0) return 0;

    const accuracyRate = fact.firstTryCorrect / fact.attempts; // 0 ~ 1
    let score = accuracyRate * 60; // 60% weight on first-try accuracy

    // Bonus for streak (up to 20 points)
    const streakBonus = Math.min(fact.streak * 5, 20);
    score += streakBonus;

    // Bonus for total successful practice (up to 10 points)
    const countBonus = Math.min(fact.firstTryCorrect * 2, 10);
    score += countBonus;

    // Speed bonus (up to 10 points if avg response time < 4 seconds)
    if (fact.averageResponseTime > 0 && fact.averageResponseTime < 4000) {
      score += 10;
    }

    // Penalty for recent wrong answers
    if (fact.lastWrongAt && (Date.now() - fact.lastWrongAt < 300000)) { // wrong in last 5 min
      score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Weighted adaptive question generator
   */
  generateQuestion(mode = "normal") {
    const candidateFacts = [];

    if (mode === "wrong_review" && this.wrongQuestionQueue.length > 0) {
      const wrongItem = this.wrongQuestionQueue.shift();
      return this.formatQuestionObject(wrongItem.factorA, wrongItem.factorB);
    }

    // Build list of valid (a, b) facts based on selectedTables
    const validPairs = [];
    this.selectedTables.forEach(t => {
      for (let other = 1; other <= 12; other++) {
        validPairs.push({ a: t, b: other });
        if (t !== other) {
          validPairs.push({ a: other, b: t });
        }
      }
    });

    // Deduplicate pairs
    const uniqueMap = new Map();
    validPairs.forEach(p => uniqueMap.set(`${p.a}x${p.b}`, p));
    const allPairs = Array.from(uniqueMap.values());

    // Compute priority weights for adaptive selection
    const weightedPairs = allPairs.map(p => {
      const rec = this.getFactRecord(p.a, p.b);
      const mastery = this.calculateMastery(rec);
      let weight = 100 - mastery; // Lower mastery = higher weight

      // Spaced repetition & wrong penalty
      if (rec.wrongCount > 0) weight += 30;
      if (rec.lastWrongAt && Date.now() - rec.lastWrongAt < 600000) weight += 40;
      if (rec.attempts === 0) weight += 25; // Introduce unpracticed facts

      // Anti-repetition penalty for recent 3 facts (including reverse 7x8 vs 8x7)
      const key = `${p.a}x${p.b}`;
      const revKey = `${p.b}x${p.a}`;
      if (this.recentFactHistory.includes(key) || this.recentFactHistory.includes(revKey)) {
        weight = Math.max(1, weight * 0.1);
      }

      return { ...p, weight: Math.max(1, weight) };
    });

    // Weighted random selection
    const totalWeight = weightedPairs.reduce((sum, item) => sum + item.weight, 0);
    let rand = this.random() * totalWeight;
    let selected = weightedPairs[0];

    for (const item of weightedPairs) {
      if (rand <= item.weight) {
        selected = item;
        break;
      }
      rand -= item.weight;
    }

    // Maintain recent history queue
    const selectedKey = `${selected.a}x${selected.b}`;
    this.recentFactHistory.push(selectedKey);
    if (this.recentFactHistory.length > 4) this.recentFactHistory.shift();

    return this.formatQuestionObject(selected.a, selected.b);
  }

  formatQuestionObject(a, b) {
    const answer = a * b;
    const distractors = this.generateDistractors(a, b, answer);
    const hint = this.getSmartHint(a, b);
    return {
      id: `${a}x${b}`,
      factorA: a,
      factorB: b,
      answer,
      options: distractors,
      hint
    };
  }

  /**
   * Smart Distractor Generator (1-12 range compliant, unique, non-negative)
   */
  generateDistractors(a, b, correct) {
    const distractors = new Set([correct]);

    const offsets = [-2, +2, -1, +1, -a, +a, -b, +b, +10, -10];
    for (const offset of offsets) {
      const candidate = correct + offset;
      if (candidate > 0 && candidate !== correct && candidate <= 144) {
        distractors.add(candidate);
      }
      if (distractors.size >= 3) break;
    }

    // Fallback if needed
    while (distractors.size < 3) {
      const randVal = Math.max(1, correct + (Math.floor(this.random() * 10) - 5));
      if (randVal !== correct) distractors.add(randVal);
    }

    // Shuffle options
    const options = Array.from(distractors);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  /**
   * Pedagogical Smart Hint Strategy for UK Children
   */
  getSmartHint(a, b) {
    const ans = a * b;
    if (a === 2 || b === 2) {
      const other = a === 2 ? b : a;
      return { type: "double", textEn: `Double ${other}: ${other} + ${other} = ${ans}`, textZh: `把 ${other} 加倍：${other} + ${other} = ${ans}` };
    }
    if (a === 5 || b === 5) {
      const other = a === 5 ? b : a;
      return { type: "count5", textEn: `Count by 5s ${other} times: 5, 10, 15...`, textZh: `逢 5 数数 ${other} 次：5, 10, 15...` };
    }
    if (a === 10 || b === 10) {
      const other = a === 10 ? b : a;
      return { type: "addZero", textEn: `Add a 0 to the end of ${other}: ${other}0`, textZh: `在 ${other} 的后面加一个 0：${other}0` };
    }
    if (a === 9 || b === 9) {
      const other = a === 9 ? b : a;
      return { type: "subNine", textEn: `Think (10 × ${other}) - ${other}: ${10 * other} - ${other} = ${ans}`, textZh: `巧妙记忆：(10 × ${other}) - ${other} = ${10 * other} - ${other} = ${ans}` };
    }
    if (a === 11 || b === 11) {
      const other = a === 11 ? b : a;
      if (other < 10) {
        return { type: "repDigit", textEn: `Repeat digit ${other}: ${ans}`, textZh: `重复数字 ${other}：${ans}` };
      }
    }
    
    // Near known fact hint (e.g. 6x7=42 -> 7x7=42+7)
    if (a > 2) {
      const prevAns = (a - 1) * b;
      return { type: "nearFact", textEn: `Use (${a - 1} × ${b} = ${prevAns}) + ${b} = ${ans}`, textZh: `推理提示：(${a - 1} × ${b} = ${prevAns}) 再加一个 ${b} 得到 ${ans}` };
    }

    return { type: "addition", textEn: `${a} groups of ${b}`, textZh: `${a} 个 ${b} 相加` };
  }

  /**
   * Record attempt result and update mastery in Profile
   */
  recordResult(question, isCorrect, isFirstTry = true, responseTimeMs = 0) {
    if (!question) return;
    const a = question.factorA;
    const b = question.factorB;
    const key = `${a}x${b}`;

    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    if (!profile.facts[key]) {
      profile.facts[key] = {
        id: key, factorA: a, factorB: b, answer: a * b,
        attempts: 0, firstTryCorrect: 0, wrongCount: 0,
        averageResponseTime: 0, streak: 0, masteryScore: 0,
        lastAnsweredAt: null, lastWrongAt: null
      };
    }

    const rec = profile.facts[key];
    rec.attempts++;
    rec.lastAnsweredAt = Date.now();

    if (isFirstTry) {
      if (rec.averageResponseTime === 0) {
        rec.averageResponseTime = responseTimeMs;
      } else {
        rec.averageResponseTime = Math.round((rec.averageResponseTime * 0.7) + (responseTimeMs * 0.3));
      }
    }

    if (isCorrect) {
      if (isFirstTry) rec.firstTryCorrect++;
      rec.streak++;
    } else {
      rec.wrongCount++;
      rec.streak = 0;
      rec.lastWrongAt = Date.now();

      // Add to wrong review queue
      if (!this.wrongQuestionQueue.some(q => q.id === question.id)) {
        this.wrongQuestionQueue.push(question);
      }
    }

    rec.masteryScore = this.calculateMastery(rec);

    // Save updated profile
    if (window.profileManager) window.profileManager.save();
  }

  /**
   * Array dot visual helper data for Easy Mode
   */
  getVisualArrayData(factorA, factorB) {
    const total = factorA * factorB;
    const additionFormula = Array(factorA).fill(factorB).join(" + ") + ` = ${total}`;
    return {
      rows: factorA,
      cols: factorB,
      total,
      additionFormula
    };
  }

  /**
   * Get 1-12 Multiplication Table Mastery Report for Parent Dashboard
   */
  getTableMasteryReport() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const report = [];

    for (let table = 1; table <= 12; table++) {
      let totalMastery = 0;
      let count = 0;

      for (let other = 1; other <= 12; other++) {
        const key = `${table}x${other}`;
        if (profile && profile.facts && profile.facts[key]) {
          totalMastery += profile.facts[key].masteryScore;
        }
        count++;
      }

      const avgMastery = Math.round(totalMastery / count);
      let level = CONFIG.MASTERY_LEVELS.NEEDS_PRACTICE;
      if (avgMastery >= 90) level = CONFIG.MASTERY_LEVELS.MASTERED;
      else if (avgMastery >= 70) level = CONFIG.MASTERY_LEVELS.GOOD;
      else if (avgMastery >= 40) level = CONFIG.MASTERY_LEVELS.LEARNING;

      report.push({
        table,
        percentage: avgMastery,
        level: level.labelEn,
        levelZh: level.labelZh,
        color: level.color
      });
    }
    return report;
  }
}

window.mathEngine = new MathEngine();
