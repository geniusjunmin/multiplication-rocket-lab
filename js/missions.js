/**
 * Multiplication Rocket Lab - Missions & Quests Engine (js/missions.js)
 */
class MissionManager {
  constructor() {
    this.missions = [
      {
        id: "m1_moon",
        nameEn: "Mission 1: Moon Base Supply",
        nameZh: "任务 1: 月球基地补给线",
        tables: [2, 5, 10],
        icon: "🌙",
        descEn: "Practice ×2, ×5, ×10 tables to supply the lunar science base!",
        descZh: "练习 2、5、10 乘法表，为月球科考基地输送物资！"
      },
      {
        id: "m2_mars",
        nameEn: "Mission 2: Mars Colonization",
        nameZh: "任务 2: 火星拓荒行动",
        tables: [3, 4, 8],
        icon: "🔴",
        descEn: "Master ×3, ×4, ×8 tables to power the Mars colony engines!",
        descZh: "掌握 3、4、8 乘法表，为火星殖民地火箭注入能量！"
      },
      {
        id: "m3_jupiter",
        nameEn: "Mission 3: Jupiter Probe Exploration",
        nameZh: "任务 3: 木星风暴探险号",
        tables: [6, 7, 9],
        icon: "🪐",
        descEn: "Conquer ×6, ×7, ×9 tables for deep space Jovian exploration!",
        descZh: "征服 6、7、9 乘法表，深入木星赤红风暴探索！"
      },
      {
        id: "m4_deepspace",
        nameEn: "Mission 4: Grand Tour (1-12)",
        nameZh: "任务 4: 深空大满贯 (1-12)",
        tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        icon: "🌌",
        descEn: "Full 1×1 to 12×12 multiplication master challenge!",
        descZh: "完整 1×1 到 12×12 乘法表大师终极挑战！"
      }
    ];
  }

  getDailyMission() {
    const today = new Date().toDateString();
    return {
      id: "daily_" + today,
      nameEn: "Today's Daily Space Quest ⭐",
      nameZh: "今日宇航特别任务 ⭐",
      tables: [6, 7, 8, 9],
      targetCount: 10,
      icon: "⭐",
      descEn: "Answer 10 focus questions (×6, ×7, ×8, ×9) to earn bonus stars!",
      descZh: "完成 10 道重点练习题 (×6, ×7, ×8, ×9)，赢取星际功勋勋章！"
    };
  }
}

window.missionManager = new MissionManager();
