/**
 * Multiplication Rocket Lab - Universal Math & Fact Family Engine (js/math.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 * Supports 1x1~20x20 Multiplication & Exact Division, Fact Families, Adaptive Learning, Smart Hints & Session Analytics
 */
class MathEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.challengeConfig = CONFIG.MATH_CHALLENGE_PRESETS.times12;
    this.wrongQuestionQueue = [];
    this.recentFactHistory = [];

    this.sessionStats = {
      questionsPresented: 0,
      totalAttempts: 0,
      firstTryCorrect: 0,
      wrongAttempts: 0,
      correctFinalAnswers: 0,
      averageResponseTimeMs: 0,
      maxCombo: 0
    };
  }

  resetSessionStats() {
    this.sessionStats = {
      questionsPresented: 0,
      totalAttempts: 0,
      firstTryCorrect: 0,
      wrongAttempts: 0,
      correctFinalAnswers: 0,
      averageResponseTimeMs: 0,
      maxCombo: 0
    };
    this.wrongQuestionQueue = [];
    this.recentFactHistory = [];
  }

  setChallengeConfig(config) {
    if (config) {
      this.challengeConfig = { ...CONFIG.MATH_CHALLENGE_PRESETS.times12, ...config };
    }
  }

  setTables(tables) {
    if (Array.isArray(tables) && tables.length > 0) {
      const minVal = Math.min(...tables);
      const maxVal = Math.max(...tables);
      this.setChallengeConfig({
        factorAMin: minVal,
        factorAMax: maxVal,
        factorBMin: 1,
        factorBMax: 12
      });
    }
  }

  getFactKey(operation, opA, opB) {
    if (operation === "divide") {
      return `div:${opA}/${opB}`;
    }
    return `mul:${opA}x${opB}`;
  }

  getFactFamilyKey(a, b) {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `family:${min}:${max}`;
  }

  getFactRecord(operation, opA, opB) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const key = this.getFactKey(operation, opA, opB);
    if (profile && profile.facts && profile.facts[key]) {
      return profile.facts[key];
    }
    return {
      id: key,
      operation,
      operandA: opA,
      operandB: opB,
      answer: operation === "divide" ? Math.round(opA / opB) : opA * opB,
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

  calculateMastery(fact) {
    if (!fact || fact.attempts === 0) return 0;
    const accuracyRate = fact.firstTryCorrect / fact.attempts;
    let score = accuracyRate * 60;

    const streakBonus = Math.min(fact.streak * 5, 20);
    score += streakBonus;

    const countBonus = Math.min(fact.firstTryCorrect * 2, 10);
    score += countBonus;

    if (fact.averageResponseTime > 0 && fact.averageResponseTime < 4000) {
      score += 10;
    }

    if (fact.lastWrongAt && (Date.now() - fact.lastWrongAt < 300000)) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getTableMasteryReport() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const report = [];

    for (let table = 1; table <= 12; table++) {
      let sum = 0;
      let count = 0;
      for (let b = 1; b <= 12; b++) {
        const key = `mul:${table}x${b}`;
        const fact = (profile && profile.facts) ? profile.facts[key] : null;
        const score = fact ? (fact.masteryScore || 0) : 0;
        sum += score;
        count++;
      }
      const averageMastery = Math.round(sum / count);
      report.push({
        table,
        averageMastery,
        percentage: averageMastery // backward-compatibility alias
      });
    }
    return report;
  }

  getWeakestFactFamilies(count = 5) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile || !profile.factFamilies) return [];

    const famList = Object.values(profile.factFamilies);
    famList.sort((a, b) => (a.overallMastery || 0) - (b.overallMastery || 0));
    return famList.slice(0, count);
  }

  getRecommendedFocusTables(count = 3) {
    const report = this.getTableMasteryReport();
    report.sort((a, b) => a.averageMastery - b.averageMastery);
    return report.slice(0, count).map(r => r.table);
  }

  /**
   * Universal Question Generator (Supports Multiply, Divide, Custom Ranges & Adaptive Weak Facts)
   */
  generateQuestion(mode = "normal", customFilter = null) {
    if (mode === "wrong_review" && this.wrongQuestionQueue.length > 0) {
      const wrongItem = this.wrongQuestionQueue.shift();
      return this.formatQuestionObject(wrongItem.operation, wrongItem.operandA, wrongItem.operandB);
    }

    const cfg = this.challengeConfig;
    const ops = (customFilter && customFilter.operations) ? customFilter.operations : (cfg.operations || ["multiply"]);
    const isDivision = ops.includes("divide") && (ops.length === 1 || this.random() > 0.45);

    let tablesA = customFilter && customFilter.focusTables ? customFilter.focusTables : null;
    let minA = cfg.factorAMin || 1;
    let maxA = cfg.factorAMax || 12;
    let minB = cfg.factorBMin || 1;
    let maxB = cfg.factorBMax || 12;

    const candidatePairs = [];
    if (tablesA && Array.isArray(tablesA) && tablesA.length > 0) {
      tablesA.forEach(a => {
        for (let b = minB; b <= maxB; b++) {
          candidatePairs.push({ a, b });
        }
      });
    } else {
      for (let a = minA; a <= maxA; a++) {
        for (let b = minB; b <= maxB; b++) {
          candidatePairs.push({ a, b });
        }
      }
    }

    if (candidatePairs.length === 0) {
      candidatePairs.push({ a: 7, b: 8 });
    }

    // Weighted adaptive selection
    const weightedPairs = candidatePairs.map(p => {
      const rec = this.getFactRecord(isDivision ? "divide" : "multiply", isDivision ? p.a * p.b : p.a, isDivision ? p.a : p.b);
      const mastery = this.calculateMastery(rec);
      let weight = 100 - mastery;

      if (rec.wrongCount > 0) weight += 30;
      if (rec.lastWrongAt && Date.now() - rec.lastWrongAt < 600000) weight += 40;
      if (rec.attempts === 0) weight += 20;

      const key = `${p.a}x${p.b}`;
      if (this.recentFactHistory.includes(key)) {
        weight = Math.max(1, weight * 0.1);
      }
      return { ...p, weight: Math.max(1, weight) };
    });

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

    const selectedKey = `${selected.a}x${selected.b}`;
    this.recentFactHistory.push(selectedKey);
    if (this.recentFactHistory.length > 4) this.recentFactHistory.shift();

    if (isDivision) {
      const prod = selected.a * selected.b;
      return this.formatQuestionObject("divide", prod, selected.a);
    } else {
      return this.formatQuestionObject("multiply", selected.a, selected.b);
    }
  }

  formatQuestionObject(operation, opA, opB) {
    const isDiv = operation === "divide";
    const answer = isDiv ? Math.round(opA / opB) : opA * opB;
    const display = isDiv ? `${opA} ÷ ${opB}` : `${opA} × ${opB}`;
    
    const factorA = isDiv ? opB : opA;
    const factorB = isDiv ? answer : opB;
    const factFamilyKey = this.getFactFamilyKey(factorA, factorB);
    const id = isDiv ? `div:${opA}/${opB}` : `mul:${opA}x${opB}`;

    const distractors = this.generateDistractors(operation, opA, opB, answer);
    const hintL1 = this.getSmartHint(operation, opA, opB, answer, 1);
    const hintL2 = this.getSmartHint(operation, opA, opB, answer, 2);

    return {
      id,
      operation,
      operandA: opA,
      operandB: opB,
      factorA,
      factorB,
      answer,
      display,
      factFamilyKey,
      options: distractors,
      hint: hintL1,
      hintL1,
      hintL2
    };
  }

  generateDistractors(operation, opA, opB, correct) {
    const distractors = new Set([correct]);
    const offsets = operation === "divide" ? [-2, +2, -1, +1, +3, -3, +5] : [-2, +2, -1, +1, -opA, +opA, -opB, +opB, +10, -10];

    for (const offset of offsets) {
      const candidate = correct + offset;
      if (candidate > 0 && candidate !== correct && candidate <= 2500) {
        distractors.add(candidate);
      }
      if (distractors.size >= 3) break;
    }

    while (distractors.size < 3) {
      const randVal = Math.max(1, correct + (Math.floor(this.random() * 10) - 5));
      if (randVal !== correct) distractors.add(randVal);
    }

    const options = Array.from(distractors);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  getSmartHint(operation, opA, opB, answer, hintLevel = 1) {
    if (operation === "divide") {
      if (hintLevel === 1) {
        return {
          type: "thinkMul",
          level: 1,
          textEn: `Think reverse: ${opB} × ? = ${opA}`,
          textZh: `逆向思考：${opB} × ? = ${opA}`
        };
      } else {
        return {
          type: "thinkMulSolution",
          level: 2,
          textEn: `Since ${opB} × ${answer} = ${opA}, therefore ${opA} ÷ ${opB} = ${answer}`,
          textZh: `因为 ${opB} × ${answer} = ${opA}，所以 ${opA} ÷ ${opB} = ${answer}`
        };
      }
    }

    // Multiplication Hints
    const a = opA; const b = opB;
    if (a === 2 || b === 2) {
      const other = a === 2 ? b : a;
      if (hintLevel === 1) {
        return { type: "double", level: 1, textEn: `Double strategy: ${other} + ${other} = ?`, textZh: `翻倍思考：把 ${other} 加倍，${other} + ${other} = ?` };
      } else {
        return { type: "doubleSol", level: 2, textEn: `${other} + ${other} = ${answer}. So ${a} × ${b} = ${answer}`, textZh: `${other} + ${other} = ${answer}，所以 ${a} × ${b} = ${answer}` };
      }
    }
    if (a === 5 || b === 5) {
      const other = a === 5 ? b : a;
      if (hintLevel === 1) {
        return { type: "count5", level: 1, textEn: `Count by 5s ${other} times: 5, 10, 15...`, textZh: `逢 5 数数 ${other} 次：5, 10, 15...` };
      } else {
        return { type: "count5Sol", level: 2, textEn: `5 × ${other} = ${answer}. So ${a} × ${b} = ${answer}`, textZh: `5 × ${other} = ${answer}，所以 ${a} × ${b} = ${answer}` };
      }
    }
    if (a === 10 || b === 10) {
      const other = a === 10 ? b : a;
      if (hintLevel === 1) {
        return { type: "addZero", level: 1, textEn: `Place a 0 after ${other}: ${other}0`, textZh: `在 ${other} 后面加一个 0` };
      } else {
        return { type: "addZeroSol", level: 2, textEn: `10 × ${other} = ${answer}`, textZh: `10 × ${other} = ${answer}` };
      }
    }
    if (a === 9 || b === 9) {
      const other = a === 9 ? b : a;
      if (hintLevel === 1) {
        return { type: "subNine", level: 1, textEn: `Think (10 × ${other}) - ${other}: ${10 * other} - ${other} = ?`, textZh: `巧妙记忆：先算 10 × ${other} = ${10 * other}，再减一个 ${other}：${10 * other} - ${other} = ?` };
      } else {
        return { type: "subNineSol", level: 2, textEn: `${10 * other} - ${other} = ${answer}. So ${a} × ${b} = ${answer}`, textZh: `${10 * other} - ${other} = ${answer}，所以 ${a} × ${b} = ${answer}` };
      }
    }
    
    if (a > 2) {
      const prevAns = (a - 1) * b;
      if (hintLevel === 1) {
        return { type: "nearFact", level: 1, textEn: `Think: ${a - 1} × ${b} = ${prevAns}, then add one ${b}: ${prevAns} + ${b} = ?`, textZh: `你可以先算：${a - 1} × ${b} = ${prevAns}，然后再加一个 ${b}：${prevAns} + ${b} = ?` };
      } else {
        return { type: "nearFactSol", level: 2, textEn: `${prevAns} + ${b} = ${answer}. So ${a} × ${b} = ${answer}`, textZh: `${prevAns} + ${b} = ${answer}，所以 ${a} × ${b} = ${answer}` };
      }
    }

    if (hintLevel === 1) {
      return { type: "addition", level: 1, textEn: `Add ${a} groups of ${b}`, textZh: `将 ${a} 个 ${b} 相加` };
    } else {
      return { type: "additionSol", level: 2, textEn: `${a} × ${b} = ${answer}`, textZh: `${a} × ${b} = ${answer}` };
    }
  }

  /**
   * Record every single user answer attempt accurately
   */
  recordResult(question, isCorrect, isFirstTry = true, responseTimeMs = 0) {
    if (!question) return;
    const op = question.operation || "multiply";
    const key = this.getFactKey(op, question.operandA, question.operandB);

    // Update session stats
    this.sessionStats.totalAttempts++;
    if (isFirstTry) {
      this.sessionStats.questionsPresented++;
      if (isCorrect) {
        this.sessionStats.firstTryCorrect++;
      } else {
        this.sessionStats.wrongAttempts++;
      }
      if (this.sessionStats.averageResponseTimeMs === 0) {
        this.sessionStats.averageResponseTimeMs = responseTimeMs;
      } else {
        this.sessionStats.averageResponseTimeMs = Math.round(
          (this.sessionStats.averageResponseTimeMs * 0.7) + (responseTimeMs * 0.3)
        );
      }
    } else {
      if (!isCorrect) {
        this.sessionStats.wrongAttempts++;
      }
    }

    if (isCorrect) {
      this.sessionStats.correctFinalAnswers++;
    }

    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    // Track total attempt counts on profile
    profile.totalAttempts = (profile.totalAttempts || 0) + 1;
    if (isFirstTry && isCorrect) {
      profile.totalFirstTryCorrect = (profile.totalFirstTryCorrect || 0) + 1;
    }
    if (!isCorrect) {
      profile.totalWrongAttempts = (profile.totalWrongAttempts || 0) + 1;
    }

    if (!profile.facts[key]) {
      profile.facts[key] = profileManager.createEmptyFactRecord(key, op, question.operandA, question.operandB, question.answer);
    }

    const rec = profile.facts[key];
    const prevMastery = rec.masteryScore || 0;
    rec.attempts++;
    rec.lastAnsweredAt = Date.now();

    if (isFirstTry) {
      if (rec.averageResponseTime === 0) rec.averageResponseTime = responseTimeMs;
      else rec.averageResponseTime = Math.round((rec.averageResponseTime * 0.7) + (responseTimeMs * 0.3));
    }

    if (isCorrect) {
      if (isFirstTry) rec.firstTryCorrect++;
      rec.streak++;
    } else {
      rec.wrongCount++;
      rec.streak = 0;
      rec.lastWrongAt = Date.now();

      if (!this.wrongQuestionQueue.some(q => q.id === question.id)) {
        this.wrongQuestionQueue.push(question);
      }
    }

    rec.masteryScore = this.calculateMastery(rec);

    // Track if a weak fact has newly improved
    let masteryImproved = false;
    if (prevMastery < 70 && rec.masteryScore >= 70) {
      masteryImproved = true;
    }

    // Update Fact Family Master Record
    if (question.factFamilyKey && profile.factFamilies[question.factFamilyKey]) {
      const fam = profile.factFamilies[question.factFamilyKey];
      const relMulKey = `mul:${question.factorA}x${question.factorB}`;
      const relDivKey = `div:${question.factorA * question.factorB}/${question.factorA}`;
      
      const m1 = profile.facts[relMulKey] ? profile.facts[relMulKey].masteryScore : 0;
      const m2 = profile.facts[relDivKey] ? profile.facts[relDivKey].masteryScore : 0;
      fam.overallMastery = Math.round((m1 + m2) / 2);
    }

    if (window.profileManager) window.profileManager.save();

    // Trigger unlock check if mastery improved
    if (masteryImproved && window.progressionManager) {
      window.progressionManager.evaluateUnlocks();
    }

    return {
      masteryImproved,
      factKey: key,
      prevMastery,
      newMastery: rec.masteryScore
    };
  }

  getFirstTryAccuracy() {
    if (this.sessionStats.questionsPresented === 0) {
      return 100;
    }
    return Math.round((this.sessionStats.firstTryCorrect / this.sessionStats.questionsPresented) * 100);
  }

  getFinalCompletionRate() {
    if (this.sessionStats.questionsPresented === 0) {
      return 100;
    }
    return Math.round((this.sessionStats.correctFinalAnswers / this.sessionStats.questionsPresented) * 100);
  }

  getVisualArrayData(question) {
    const op = question.operation || "multiply";
    if (op === "divide") {
      return {
        type: "divide",
        total: question.operandA,
        groups: question.operandB,
        perGroup: question.answer,
        formula: `${question.operandA} ÷ ${question.operandB} = ${question.answer}`
      };
    }
    return {
      type: "multiply",
      rows: question.operandA,
      cols: question.operandB,
      total: question.answer,
      additionFormula: Array(question.operandA).fill(question.operandB).join(" + ") + ` = ${question.answer}`
    };
  }

  getOperationMasterySummary() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return { multiplication: 0, division: 0 };

    let mulSum = 0; let mulCount = 0;
    let divSum = 0; let divCount = 0;

    Object.values(profile.facts).forEach(f => {
      if (f.attempts > 0) {
        if (f.operation === "divide") {
          divSum += f.masteryScore; divCount++;
        } else {
          mulSum += f.masteryScore; mulCount++;
        }
      }
    });

    return {
      multiplication: mulCount > 0 ? Math.round(mulSum / mulCount) : 0,
      division: divCount > 0 ? Math.round(divSum / divCount) : 0
    };
  }
}

window.mathEngine = new MathEngine();
if (typeof module !== "undefined") {
  module.exports = { MathEngine };
}
