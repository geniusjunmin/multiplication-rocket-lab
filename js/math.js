/**
 * 乘法火箭实验室 - 数学题目生成与自适应算法引擎 (math.js)
 */
class MathEngine {
  constructor() {
    this.selectedTables = [2, 3, 4, 5];
    this.wrongQuestionQueue = [];
    this.questionHistory = [];
    this.masteredQuestions = new Set();
    this.tableStats = {};

    // 初始化 2-9 的统计数据
    for (let i = 2; i <= 9; i++) {
      this.tableStats[i] = { total: 0, correct: 0, wrong: 0 };
    }
  }

  /**
   * 设置选中的乘法表范围
   */
  setTables(tablesArray) {
    if (Array.isArray(tablesArray) && tablesArray.length > 0) {
      this.selectedTables = tablesArray.map(Number);
    } else {
      this.selectedTables = [2, 3, 4, 5];
    }
  }

  /**
   * 生成单道乘法题目对象
   */
  generateQuestion() {
    // 优先从错题队列中抽取 20% 的概率复习错题
    if (this.wrongQuestionQueue.length > 0 && Math.random() < 0.25) {
      const wrongQ = this.wrongQuestionQueue.shift();
      wrongQ.isRetry = true;
      return wrongQ;
    }

    // 随机选择一个因数 A（来自选中的乘法表）
    const factorA = this.selectedTables[Math.floor(Math.random() * this.selectedTables.length)];
    // 因数 B（范围 1~9）
    const factorB = Math.floor(Math.random() * 9) + 1;

    // 随机是否交换因子顺序
    const swap = Math.random() > 0.5;
    const num1 = swap ? factorB : factorA;
    const num2 = swap ? factorA : factorB;
    const answer = num1 * num2;
    const id = `${num1}x${num2}`;

    const question = {
      id,
      factorA: num1,
      factorB: num2,
      baseTable: factorA,
      answer,
      attempts: 0,
      correct: false,
      isRetry: false,
      options: this.generateDistractors(num1, num2, answer)
    };

    return question;
  }

  /**
   * 为选择题生成 3 个合理且易混淆的干扰项答案
   */
  generateDistractors(a, b, correctAnswer) {
    const distractors = new Set();
    
    // 策略 1: 相邻乘法积 (a * (b+1)) 或 (a * (b-1))
    if (b + 1 <= 9) distractors.add(a * (b + 1));
    if (b - 1 >= 1) distractors.add(a * (b - 1));
    if (a + 1 <= 9) distractors.add((a + 1) * b);
    if (a - 1 >= 1) distractors.add((a - 1) * b);

    // 策略 2: 加减法混淆 (a + b)
    distractors.add(a + b);

    // 策略 3: 数字倒置或十位数微调 (如 56 -> 65 或 54)
    if (correctAnswer > 10) {
      distractors.add(correctAnswer + 10);
      distractors.add(Math.max(1, correctAnswer - 10));
    }

    // 筛选非法干扰项：不能等于正确答案，且大于 0
    const validCandidates = Array.from(distractors).filter(
      val => val !== correctAnswer && val > 0
    );

    // 从候选集中随机选 2 个，若不足则补充邻近随机数
    const finalChoices = [];
    while (finalChoices.length < 2 && validCandidates.length > 0) {
      const idx = Math.floor(Math.random() * validCandidates.length);
      finalChoices.push(validCandidates.splice(idx, 1)[0]);
    }

    while (finalChoices.length < 2) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 1);
      const candidate = correctAnswer + offset;
      if (candidate > 0 && candidate !== correctAnswer && !finalChoices.includes(candidate)) {
        finalChoices.push(candidate);
      }
    }

    // 包含正确答案并随机打乱顺序
    const allChoices = [correctAnswer, ...finalChoices];
    return this.shuffleArray(allChoices);
  }

  /**
   * 洗牌算法
   */
  shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * 记录答题结果并更新统计
   */
  recordResult(question, isCorrect, firstAttempt = true) {
    const tableKey = this.selectedTables.includes(question.factorA) ? question.factorA : question.factorB;
    
    if (this.tableStats[tableKey]) {
      this.tableStats[tableKey].total++;
      if (isCorrect) {
        this.tableStats[tableKey].correct++;
      } else {
        this.tableStats[tableKey].wrong++;
      }
    }

    if (isCorrect) {
      if (firstAttempt) {
        this.masteredQuestions.add(question.id);
      }
    } else {
      // 将答错的题目加入错题队列稍后重练
      if (!this.wrongQuestionQueue.some(q => q.id === question.id)) {
        this.wrongQuestionQueue.push({ ...question });
      }
    }
  }

  /**
   * 生成乘法辅助可视化数据 (三行四列点阵)
   */
  getVisualArrayData(factorA, factorB) {
    const rows = factorA;
    const cols = factorB;
    const icons = ["🚀", "⭐", "🔋", "💎", "🛸"];
    const chosenIcon = icons[Math.floor(Math.random() * icons.length)];
    
    let additionFormula = "";
    for (let i = 0; i < rows; i++) {
      additionFormula += cols + (i === rows - 1 ? "" : " + ");
    }
    additionFormula += ` = ${factorA * factorB}`;

    return {
      rows,
      cols,
      icon: chosenIcon,
      additionFormula
    };
  }

  /**
   * 计算各乘法表的掌握度百分比 (用于家长报告)
   */
  getTableMasteryReport() {
    const report = [];
    for (let i = 2; i <= 9; i++) {
      const stat = this.tableStats[i] || { total: 0, correct: 0 };
      const percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      report.push({
        table: i,
        name: `${i} 的乘法表`,
        percentage,
        total: stat.total,
        correct: stat.correct
      });
    }
    return report;
  }
}

// 导出单例对象
window.mathEngine = new MathEngine();
