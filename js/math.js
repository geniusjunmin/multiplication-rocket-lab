/**
 * Multiplication Rocket Lab - Universal Math & Fact Family Engine (js/math.js)
 * Supports 1x1~20x20 Multiplication & Exact Division, Fact Families, Adaptive Learning & Smart Hints
 */
class MathEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.challengeConfig = CONFIG.MATH_CHALLENGE_PRESETS.times12;
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
        const score = fact ? fact.masteryScore : 0;
        sum += score;
        count++;
      }
      report.push({
        table,
        averageMastery: Math.round(sum / count)
      });
    }
    return report;
  }

  /**
   * Universal Question Generator (Supports Multiply, Divide & Custom 1-20 Range)
   */
  generateQuestion(mode = "normal") {
    if (mode === "wrong_review" && this.wrongQuestionQueue.length > 0) {
      const wrongItem = this.wrongQuestionQueue.shift();
      return this.formatQuestionObject(wrongItem.operation, wrongItem.operandA, wrongItem.operandB);
    }

    const cfg = this.challengeConfig;
    const ops = cfg.operations || ["multiply"];
    const isDivision = ops.includes("divide") && (ops.length === 1 || this.random() > 0.45);

    const minA = cfg.factorAMin || 1;
    const maxA = cfg.factorAMax || 12;
    const minB = cfg.factorBMin || 1;
    const maxB = cfg.factorBMax || 12;

    // Pick (a, b) in range
    const candidatePairs = [];
    for (let a = minA; a <= maxA; a++) {
      for (let b = minB; b <= maxB; b++) {
        candidatePairs.push({ a, b });
      }
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
    const hint = this.getSmartHint(operation, opA, opB, answer);

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
      hint
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

  getSmartHint(operation, opA, opB, answer) {
    if (operation === "divide") {
      return {
        type: "thinkMul",
        textEn: `Think: ${opB} × ? = ${opA}`,
        textZh: `逆向思考：${opB} × ? = ${opA}`
      };
    }

    // Multiplication Hints
    const a = opA; const b = opB;
    if (a === 2 || b === 2) {
      const other = a === 2 ? b : a;
      return { type: "double", textEn: `Double ${other}: ${other} + ${other} = ${answer}`, textZh: `把 ${other} 加倍：${other} + ${other} = ${answer}` };
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
      return { type: "subNine", textEn: `Think (10 × ${other}) - ${other}: ${10 * other} - ${other} = ${answer}`, textZh: `巧妙记忆：(10 × ${other}) - ${other} = ${10 * other} - ${other} = ${answer}` };
    }
    
    if (a > 2) {
      const prevAns = (a - 1) * b;
      return { type: "nearFact", textEn: `Use (${a - 1} × ${b} = ${prevAns}) + ${b} = ${answer}`, textZh: `推理提示：(${a - 1} × ${b} = ${prevAns}) 再加一个 ${b} 得到 ${answer}` };
    }

    return { type: "addition", textEn: `${a} groups of ${b}`, textZh: `${a} 个 ${b} 相加` };
  }

  recordResult(question, isCorrect, isFirstTry = true, responseTimeMs = 0) {
    if (!question) return;
    const op = question.operation || "multiply";
    const key = this.getFactKey(op, question.operandA, question.operandB);

    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    if (!profile.facts[key]) {
      profile.facts[key] = profileManager.createEmptyFactRecord(key, op, question.operandA, question.operandB, question.answer);
    }

    const rec = profile.facts[key];
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
