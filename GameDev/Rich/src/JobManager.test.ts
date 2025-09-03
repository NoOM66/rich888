import { JobManager } from './JobManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { Job } from './Job';
import { Jobs } from './JobsData';

// Mock dependencies
const mockPlayerStatsControllerInstance = {
  getPlayerData: jest.fn(),
  updateCurrentJob: jest.fn(),
  addMoney: jest.fn(),
  applyStressChange: jest.fn(),
  applyHappinessChange: jest.fn(),
  updateJobExperience: jest.fn(),
};

const mockGlobalEventEmitterInstance = {
  on: jest.fn(),
  emit: jest.fn(),
};

const mockTurnManagerInstance = {
  trySpendTime: jest.fn(() => true),
};

jest.mock('./PlayerStatsController', () => ({
  PlayerStatsController: {
    get instance() {
      return mockPlayerStatsControllerInstance;
    },
  },
}));

jest.mock('./GlobalEventEmitter', () => ({
  GlobalEventEmitter: {
    get instance() {
      return mockGlobalEventEmitterInstance;
    },
  },
}));

jest.mock('./TurnManager', () => ({
  TurnManager: {
    get instance() {
      return mockTurnManagerInstance;
    },
  },
}));

describe('JobManager', () => {
  let jobManager: JobManager;

  const partTimeJob: Job = Jobs.find(job => job.id === 'part_time_worker')!;
  const juniorStaffJob: Job = Jobs.find(job => job.id === 'junior_staff')!;

  beforeEach(() => {
    jest.clearAllMocks();

    

    // Re-initialize JobManager to ensure fresh state for each test
    (JobManager as any).instance = null;
    jobManager = JobManager.getInstance();
  });

  // 9.1. เทสการเลือกงานและการตรวจสอบคุณสมบัติ
  describe('selectJob', () => {
    it('should allow selecting a job if education requirement is met', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: 10,
      } as any);

      const result = jobManager.selectJob(juniorStaffJob);
      expect(result).toBe(true);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(PlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(juniorStaffJob);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onJobSelected', juniorStaffJob);
    });

    it('should not allow selecting a job if education requirement is not met', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: 5,
      } as any);

      const result = jobManager.selectJob(juniorStaffJob);
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(PlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });
  });

  // 9.2. เทสการรับเงินเดือนและการเปลี่ยนแปลงค่าสถานะรายสัปดาห์
  describe('handleWeekStart (weekly work)', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      PlayerStatsController.instance.addMoney.mockClear();
      GlobalEventEmitter.instance.emit.mockClear();
    });

    it('should apply salary, stat changes, and spend time if player has a job', () => {
      (jobManager as any).handleWeekStart(1);

      expect(PlayerStatsController.instance.addMoney).toHaveBeenCalledWith(partTimeJob.baseSalary);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onSalaryReceived', partTimeJob.baseSalary);
      expect(PlayerStatsController.instance.applyStressChange).toHaveBeenCalledWith(partTimeJob.stressPerWeek);
      expect(PlayerStatsController.instance.applyHappinessChange).toHaveBeenCalledWith(partTimeJob.happinessChangePerWeek);
      expect(TurnManager.instance.trySpendTime).toHaveBeenCalledWith(partTimeJob.timeCost);
      expect(PlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(1);
    });

    it('should not do anything if player does not have a job', () => {
      (jobManager as any).currentJob = null;
      (jobManager as any).handleWeekStart(1);

      expect(PlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
      expect(GlobalEventEmitter.instance.emit).not.toHaveBeenCalledWith('onSalaryReceived', expect.any(Number));
    });
  });

  // 9.3. เทสกลไกการเลื่อนตำแหน่ง (ทั้งกรณีที่ผ่านและไม่ผ่านเงื่อนไข)
  describe('promote', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      PlayerStatsController.instance.updateCurrentJob.mockClear();
      PlayerStatsController.instance.updateJobExperience.mockClear();
      GlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow promotion if all requirements are met', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement,
        jobExperience: partTimeJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(true);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(PlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(juniorStaffJob);
      expect(PlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(0);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onPromoted', juniorStaffJob);
    });

    it('should not allow promotion if education requirement is not met', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement - 1,
        jobExperience: partTimeJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(partTimeJob);
      expect(PlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });

    it('should not allow promotion if experience requirement is not met', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement,
        jobExperience: partTimeJob.promotionExperienceRequirement - 1,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(partTimeJob);
      expect(PlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });

    it('should not allow promotion if current job has no next level', () => {
      jobManager.selectJob(juniorStaffJob);
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: juniorStaffJob.promotionEducationRequirement,
        jobExperience: juniorStaffJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(PlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });
  });

  // 9.4. เทสการลาออก
  describe('quitJob', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      PlayerStatsController.instance.updateCurrentJob.mockClear();
      PlayerStatsController.instance.updateJobExperience.mockClear();
      GlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow quitting a job', () => {
      jobManager.quitJob();
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(PlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(null);
      expect(PlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(0);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onJobQuit', partTimeJob);
    });

    it('should do nothing if there is no current job to quit', () => {
      jobManager.quitJob();
      PlayerStatsController.instance.updateCurrentJob.mockClear();
      PlayerStatsController.instance.updateJobExperience.mockClear();
      GlobalEventEmitter.instance.emit.mockClear();

      jobManager.quitJob();
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(PlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
      expect(PlayerStatsController.instance.updateJobExperience).not.toHaveBeenCalled();
      expect(GlobalEventEmitter.instance.emit).not.toHaveBeenCalled();
    });
  });
});