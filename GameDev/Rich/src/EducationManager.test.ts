import { EducationManager } from './EducationManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { Course } from './Course';
import { Courses } from './CoursesData';

// Mock dependencies
jest.mock('./PlayerStatsController');
jest.mock('./GlobalEventEmitter');
jest.mock('./TurnManager');

describe('EducationManager', () => {
  let educationManager: EducationManager;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;

  const basicMathCourse: Course = Courses.find(course => course.id === 'basic_math')!;
  const advancedProgrammingCourse: Course = Courses.find(course => course.id === 'advanced_programming')!;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      getPlayerData: jest.fn(() => ({
        money: 1000,
        currentEducationLevel: 0,
        currentCourse: null,
      })),
      decreaseMoney: jest.fn(),
      updateCurrentCourse: jest.fn(),
      updateCurrentEducationLevel: jest.fn(),
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

    // Re-initialize EducationManager to ensure fresh state for each test
    (EducationManager as any).instance = null;
    educationManager = EducationManager.getInstance();
  });

  // 7.1. เทส `EnrollCourse` (ทั้งกรณีที่ผ่านและไม่ผ่านเงื่อนไข)
  describe('enrollCourse', () => {
    it('should allow enrolling in a course if all requirements are met', () => {
      const result = educationManager.enrollCourse(basicMathCourse);
      expect(result).toBe(true);
      expect(educationManager.getCurrentCourse()).toBe(basicMathCourse);
      expect(educationManager.getWeeksRemaining()).toBe(basicMathCourse.timeRequired);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(basicMathCourse.cost);
      expect(mockTurnManager.instance.trySpendTime).toHaveBeenCalledWith(basicMathCourse.timeRequired * 40);
      expect(mockPlayerStatsController.instance.updateCurrentCourse).toHaveBeenCalledWith(basicMathCourse);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onCourseEnrolled', basicMathCourse);
    });

    it('should not allow enrolling if already enrolled in a course', () => {
      educationManager.enrollCourse(basicMathCourse);
      const result = educationManager.enrollCourse(advancedProgrammingCourse);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledTimes(1);
    });

    it('should not allow enrolling if prerequisite education level is not met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        currentEducationLevel: 5,
        currentCourse: null,
      });
      const result = educationManager.enrollCourse(advancedProgrammingCourse);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });

    it('should not allow enrolling if not enough money', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 10,
        currentEducationLevel: 0,
        currentCourse: null,
      });
      const result = educationManager.enrollCourse(basicMathCourse);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });

    it('should not allow enrolling if not enough time', () => {
      mockTurnManager.instance.trySpendTime.mockReturnValue(false);
      const result = educationManager.enrollCourse(basicMathCourse);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });
  });

  // 7.2. เทสกลไกการเรียนจบคอร์ส (การเพิ่มค่าการศึกษา, การเคลียร์คอร์ส)
  describe('handleWeekStart (course progress)', () => {
    beforeEach(() => {
      educationManager.enrollCourse(basicMathCourse);
      mockPlayerStatsController.instance.updateCurrentEducationLevel.mockClear();
      mockPlayerStatsController.instance.updateCurrentCourse.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should decrease weeks remaining each week', () => {
      (educationManager as any).handleWeekStart(1);
      expect(educationManager.getWeeksRemaining()).toBe(basicMathCourse.timeRequired - 1);
    });

    it('should complete course, add education, and clear current course when weeks remaining is zero', () => {
      (educationManager as any).weeksRemaining = 1;
      (educationManager as any).handleWeekStart(basicMathCourse.timeRequired);

      expect(educationManager.getWeeksRemaining()).toBe(0);
      expect(mockPlayerStatsController.instance.updateCurrentEducationLevel).toHaveBeenCalledWith(basicMathCourse.educationGain);
      expect(mockPlayerStatsController.instance.updateCurrentCourse).toHaveBeenCalledWith(null);
      expect(educationManager.getCurrentCourse()).toBeNull();
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onCourseCompleted', basicMathCourse);
    });
  });

  // 7.3. เทสการยิง Event
  describe('Event Emission', () => {
    it('should emit onCourseEnrolled event when enrolling', () => {
      educationManager.enrollCourse(basicMathCourse);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onCourseEnrolled', basicMathCourse);
    });

    it('should emit onCourseCompleted event when course is completed', () => {
      educationManager.enrollCourse(basicMathCourse);
      (educationManager as any).weeksRemaining = 1;
      (educationManager as any).handleWeekStart(basicMathCourse.timeRequired);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onCourseCompleted', basicMathCourse);
    });
  });
});