/**
 * 3D 火箭发射与升空动画引擎单元测试 (tests/test-launch.js)
 */
describe("4. 3D 发射引擎 (LaunchSequence)", () => {

  it("4.1 应该正常初始化发射环境与 3D 火箭模型", () => {
    const launch = new LaunchSequence();
    // 模拟火箭构建器
    window.rocketBuilder = new RocketBuilder();
    window.rocketBuilder.buildCurrentRocket();

    launch.createRocketCopy();
    Assert.isTrue(launch.rocket !== null, "应成功克隆或新建火箭模型");
    Assert.isTrue(launch.flameMesh !== null, "应成功建立发动机尾焰 Mesh");
  });

  it("4.2 应该在重置时清空倒计时与动画 Timer 句柄", () => {
    const launch = new LaunchSequence();
    launch.startCountdown(() => {});

    Assert.isTrue(launch.countdownTimer !== null, "启动倒计时后应拥有定时器句柄");
    launch.destroy();
    Assert.equal(launch.countdownTimer, null, "销毁后倒计时句柄应被清理");
  });

  it("4.3 应该在触发点火时开启火焰与灯光特效", () => {
    const launch = new LaunchSequence();
    window.rocketBuilder = new RocketBuilder();
    window.rocketBuilder.buildCurrentRocket();
    launch.createRocketCopy();

    launch.triggerIgnition(() => {});
    Assert.equal(launch.currentStage, "ignition", "当前阶段应切换为 ignition");
    Assert.isTrue(launch.flameMesh.visible, "点火后尾焰 Mesh 应变为可见");
    Assert.isAbove(launch.cameraShakeIntensity, 0, "点火时应有镜头震动参数");
  });

});
