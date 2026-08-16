/**
 * 乘法火箭实验室 - LocalStorage 存档与状态数据管理器 (storage.js)
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEY = "multiplication_rocket_save_v1";
    this.defaultData = {
      playerName: "小宇航员",
      selectedTables: [2, 3, 4, 5],
      difficulty: "normal", // 'easy' | 'normal' | 'hard'
      questionCountPerRound: 15,
      score: 0,
      unlockedParts: [],
      installedParts: [],
      currentQuestionIndex: 0,
      wrongQuestions: [],
      masteredQuestions: [],
      badges: [],
      unlockedRocketThemes: ["explorer"],
      selectedRocketTheme: "explorer",
      selectedRocketModel: "starship",
      soundEnabled: true,
      reducedMotion: false,
      gamesCompleted: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0
    };

    this.data = this.loadData();
  }

  /**
   * 从 LocalStorage 加载数据并合并默认值
   */
  loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return { ...this.defaultData };
      const parsed = JSON.parse(raw);
      return { ...this.defaultData, ...parsed };
    } catch (e) {
      console.warn("StorageManager: 无法从 LocalStorage 加载数据，使用默认设置:", e);
      return { ...this.defaultData };
    }
  }

  /**
   * 保存当前内存中的数据到 LocalStorage
   */
  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error("StorageManager: 保存 LocalStorage 失败:", e);
      return false;
    }
  }

  /**
   * 获取特定键对应的值
   */
  get(key) {
    return this.data[key];
  }

  /**
   * 更新特定键的值并保存
   */
  set(key, value) {
    this.data[key] = value;
    this.saveData();
  }

  /**
   * 批量更新数据
   */
  update(partialObj) {
    this.data = { ...this.data, ...partialObj };
    this.saveData();
  }

  /**
   * 增加解锁的火箭零件
   */
  unlockPart(partId) {
    if (!this.data.unlockedParts.includes(partId)) {
      this.data.unlockedParts.push(partId);
      this.saveData();
    }
  }

  /**
   * 标记零件已安装
   */
  installPart(partId) {
    if (!this.data.installedParts.includes(partId)) {
      this.data.installedParts.push(partId);
      this.saveData();
    }
  }

  /**
   * 获得徽章
   */
  awardBadge(badgeId) {
    if (!this.data.badges.includes(badgeId)) {
      this.data.badges.push(badgeId);
      this.saveData();
      return true; // 返回 true 表示新获得
    }
    return false;
  }

  /**
   * 重置或清除所有学习记录
   */
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.data = { ...this.defaultData };
      return true;
    } catch (e) {
      console.error("StorageManager: 清除存档失败:", e);
      return false;
    }
  }

  /**
   * 检查是否存在已保存的游戏进度
   */
  hasSaveGame() {
    return this.data.unlockedParts.length > 0 || this.data.score > 0 || this.data.gamesCompleted > 0;
  }
}

// 导出单例对象供全局访问
window.storageManager = new StorageManager();
