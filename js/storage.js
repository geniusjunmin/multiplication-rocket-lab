/**
 * Multiplication Rocket Lab - Storage & Persistence Interface (js/storage.js)
 */
class StorageManager {
  constructor() {
    this.profileManager = window.profileManager;
  }

  get(key) {
    const profile = window.profileManager.getActiveProfile();
    return profile[key];
  }

  set(key, value) {
    const update = {};
    update[key] = value;
    window.profileManager.updateActiveProfile(update);
  }

  update(partialObj) {
    window.profileManager.updateActiveProfile(partialObj);
  }

  unlockPart(partId) {
    const profile = window.profileManager.getActiveProfile();
    if (!profile.unlockedParts.includes(partId)) {
      profile.unlockedParts.push(partId);
      window.profileManager.save();
    }
  }

  installPart(partId) {
    const profile = window.profileManager.getActiveProfile();
    if (!profile.installedParts.includes(partId)) {
      profile.installedParts.push(partId);
      window.profileManager.save();
    }
  }

  awardBadge(badgeId) {
    const profile = window.profileManager.getActiveProfile();
    if (!profile.badges.includes(badgeId)) {
      profile.badges.push(badgeId);
      window.profileManager.save();
      return true;
    }
    return false;
  }

  clearAll() {
    const active = window.profileManager.getActiveProfile();
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
    const profile = window.profileManager.getActiveProfile();
    return (profile.unlockedParts && profile.unlockedParts.length > 0) || (profile.score && profile.score > 0) || (profile.gamesCompleted && profile.gamesCompleted > 0);
  }
}

window.storageManager = new StorageManager();
