/**
 * Bilingual i18n Unit Tests (tests/test-i18n.js) - Version 3.0.0
 */
describe("7. Internationalization & Bilingual Support (I18nManager 3.0)", () => {

  it("7.1 Should support switching between English and Chinese", () => {
    window.i18n.setLanguage("en");
    Assert.equal(window.i18n.currentLanguage, "en", "Current language should be en");
    Assert.equal(window.i18n.t("appTitle"), "Multiplication Rocket Lab 3.0 🚀", "English title should match");

    window.i18n.setLanguage("zh");
    Assert.equal(window.i18n.currentLanguage, "zh", "Current language should be zh");
    Assert.equal(window.i18n.t("appTitle"), "乘法火箭实验室 3.0 🚀", "Chinese title should match");
  });

  it("7.2 Should correctly interpolate parameterized keys", () => {
    window.i18n.setLanguage("en");
    const text = window.i18n.t("fuelSuccessBoost", { boost: 15 });
    Assert.includes(text, "15%", "Param {boost} should be interpolated to 15%");
  });

});
