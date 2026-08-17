/**
 * Multiplication Rocket Lab - Storage & Persistence Interface (js/storage.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 */
class StorageManager {
  constructor() {
    this.profileManager = window.profileManager;
  }

  get(key) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    return profile ? profile[key] : undefined;
  }

  set(key, value) {
    const update = {};
    update[key] = value;
    if (window.profileManager) {
      window.profileManager.updateActiveProfile(update);
    }
  }

  update(partialObj) {
    if (window.profileManager) {
      window.profileManager.updateActiveProfile(partialObj);
    }
  }

  unlockPart(partId) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;
    if (!profile.unlockedParts.includes(partId)) {
      profile.unlockedParts.push(partId);
      window.profileManager.save();
    }
  }

  installPart(partId) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;
    if (!profile.installedParts.includes(partId)) {
      profile.installedParts.push(partId);
      window.profileManager.save();
    }
  }

  awardBadge(badgeId) {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return false;
    if (!profile.badges.includes(badgeId)) {
      profile.badges.push(badgeId);
      window.profileManager.save();
      return true;
    }
    return false;
  }

  clearAll() {
    const active = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!active) return false;
    const fresh = window.profileManager.createDefaultProfile(active.name, active.yearPreset);
    fresh.id = active.id;
    
    const idx = window.profileManager.profiles.findIndex(p => p.id === active.id);
    if (idx !== -1) {
      window.profileManager.profiles[idx] = fresh;
      window.profileManager.save();
    }
    return true;
  }

  hasSaveGame() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return false;
    return (profile.unlockedParts && profile.unlockedParts.length > 0) ||
           (profile.score && profile.score > 0) ||
           (profile.gamesCompleted && profile.gamesCompleted > 0) ||
           (profile.progression && profile.progression.xp > 0);
  }
}

window.storageManager = new StorageManager();
if (typeof module !== "undefined") {
  module.exports = { StorageManager };
}
