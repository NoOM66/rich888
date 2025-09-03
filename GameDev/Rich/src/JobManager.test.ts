import { JobManager } from './JobManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { Job } from './Job';
import { Jobs } from './JobsData';

// Mock dependencies
jest.mock('./PlayerStatsController');
jest.mock('./GlobalEventEmitter');
jest.mock('./TurnManager');

describe('JobManager', () => {
  let jobManager: JobManager;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;

  const partTimeJob: Job = Jobs.find(job => job.id === 'part_time_worker')!;
  const juniorStaffJob: Job = Jobs.find(job => job.id === 'junior_staff')!;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      getPlayerData: jest.fn(() => ({
        education: 0,
        jobExperience: 0,
        money: 1000,
        stress: 0,
        happiness: 100,
      })),
      updateCurrentJob: jest.fn(),
      addMoney: jest.fn(),
      applyStressChange: jest.fn(),
      applyHappinessChange: jest.fn(),
      updateJobExperience: jest.fn(),
    } as any;

    mockGlobalEventEmitter = GlobalEventEmitter as jest.Mocked<typeof GlobalEventEmitter>;
    mockGlobalEventEmitter.instance = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockTurnManager = TurnManager as jest.Mocked<typeof TurnManager>;
    mockTurnManager.instance = {
      trySpendTime: jest.fn(() => true),
    } as any;

    // Re-initialize JobManager to ensure fresh state for each test
    (JobManager as any).instance = null;
    jobManager = JobManager.getInstance();
  });

  // 9.1. เทสการเลือกงานและการตรวจสอบคุณสมบัติ
  describe('selectJob', () => {
    it('should allow selecting a job if education requirement is met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: 10,
      } as any);

      const result = jobManager.selectJob(juniorStaffJob);
      expect(result).toBe(true);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(mockPlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(juniorStaffJob);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onJobSelected', juniorStaffJob);
    });

    it('should not allow selecting a job if education requirement is not met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: 5,
      } as any);

      const result = jobManager.selectJob(juniorStaffJob);
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(mockPlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });
  });

  // 9.2. เทสการรับเงินเดือนและการเปลี่ยนแปลงค่าสถานะรายสัปดาห์
  describe('handleWeekStart (weekly work)', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      mockPlayerStatsController.instance.addMoney.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should apply salary, stat changes, and spend time if player has a job', () => {
      (jobManager as any).handleWeekStart(1);

      expect(mockPlayerStatsController.instance.addMoney).toHaveBeenCalledWith(partTimeJob.baseSalary);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onSalaryReceived', partTimeJob.baseSalary);
      expect(mockPlayerStatsController.instance.applyStressChange).toHaveBeenCalledWith(partTimeJob.stressPerWeek);
      expect(mockPlayerStatsController.instance.applyHappinessChange).toHaveBeenCalledWith(partTimeJob.happinessChangePerWeek);
      expect(mockTurnManager.instance.trySpendTime).toHaveBeenCalledWith(partTimeJob.timeCost);
      expect(mockPlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(1);
    });

    it('should not do anything if player does not have a job', () => {
      (jobManager as any).currentJob = null;
      (jobManager as any).handleWeekStart(1);

      expect(mockPlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
      expect(mockGlobalEventEmitter.instance.emit).not.toHaveBeenCalledWith('onSalaryReceived', expect.any(Number));
    });
  });

  // 9.3. เทสกลไกการเลื่อนตำแหน่ง (ทั้งกรณีที่ผ่านและไม่ผ่านเงื่อนไข)
  describe('promote', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      mockPlayerStatsController.instance.updateCurrentJob.mockClear();
      mockPlayerStatsController.instance.updateJobExperience.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow promotion if all requirements are met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement,
        jobExperience: partTimeJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(true);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(mockPlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(juniorStaffJob);
      expect(mockPlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(0);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onPromoted', juniorStaffJob);
    });

    it('should not allow promotion if education requirement is not met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement - 1,
        jobExperience: partTimeJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(partTimeJob);
      expect(mockPlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });

    it('should not allow promotion if experience requirement is not met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: partTimeJob.promotionEducationRequirement,
        jobExperience: partTimeJob.promotionExperienceRequirement - 1,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(partTimeJob);
      expect(mockPlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });

    it('should not allow promotion if current job has no next level', () => {
      jobManager.selectJob(juniorStaffJob);
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        education: juniorStaffJob.promotionEducationRequirement,
        jobExperience: juniorStaffJob.promotionExperienceRequirement,
      } as any);

      const result = jobManager.promote();
      expect(result).toBe(false);
      expect(jobManager.getCurrentJob()).toBe(juniorStaffJob);
      expect(mockPlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
    });
  });

  // 9.4. เทสการลาออก
  describe('quitJob', () => {
    beforeEach(() => {
      jobManager.selectJob(partTimeJob);
      mockPlayerStatsController.instance.updateCurrentJob.mockClear();
      mockPlayerStatsController.instance.updateJobExperience.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow quitting a job', () => {
      jobManager.quitJob();
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(mockPlayerStatsController.instance.updateCurrentJob).toHaveBeenCalledWith(null);
      expect(mockPlayerStatsController.instance.updateJobExperience).toHaveBeenCalledWith(0);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onJobQuit', partTimeJob);
    });

    it('should do nothing if there is no current job to quit', () => {
      jobManager.quitJob();
      mockPlayerStatsController.instance.updateCurrentJob.mockClear();
      mockPlayerStatsController.instance.updateJobExperience.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();

      jobManager.quitJob();
      expect(jobManager.getCurrentJob()).toBeNull();
      expect(mockPlayerStatsController.instance.updateCurrentJob).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.updateJobExperience).not.toHaveBeenCalled();
      expect(mockGlobalEventEmitter.instance.emit).not.toHaveBeenCalled();
    });
  });
});