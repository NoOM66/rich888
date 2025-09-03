import { Course } from './Course';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';

class EducationManager {
    private static instance: EducationManager;
    private currentCourse: Course | null = null; // Reference to the player's current course
    private weeksRemaining: number = 0; // Weeks remaining for the current course

    private constructor() {
        // Private constructor to prevent direct instantiation
    }

    public static getInstance(): EducationManager {
        if (!EducationManager.instance) {
            EducationManager.instance = new EducationManager();
        }
        return EducationManager.instance;
    }

    public getCurrentCourse(): Course | null {
        return this.currentCourse;
    }

    public getWeeksRemaining(): number {
        return this.weeksRemaining;
    }

    public enrollCourse(course: Course): boolean {
        const playerData = PlayerStatsController.instance.getPlayerData();

        if (this.currentCourse) {
            console.warn("Already enrolled in a course. Complete current course first.");
            return false;
        }

        if (playerData.currentEducationLevel < course.prerequisiteEducationLevel) {
            console.warn(`Cannot enroll in ${course.courseName}. Prerequisite education level not met. Needed: ${course.prerequisiteEducationLevel}, Have: ${playerData.currentEducationLevel}`);
            return false;
        }

        if (playerData.money < course.cost) {
            console.warn(`Not enough money to enroll in ${course.courseName}. Cost: ${course.cost}, Have: ${playerData.money}`);
            return false;
        }

        // Assuming timeRequired is in weeks for course duration, and 1 week of course takes 40 hours of time budget.
        const timeCostInHours = course.timeRequired * 40; // Example conversion

        if (!TurnManager.instance.trySpendTime(timeCostInHours)) {
            console.warn(`Not enough time to enroll in ${course.courseName}. Time needed: ${timeCostInHours}, Remaining: ${TurnManager.instance.timeBudget}`);
            return false;
        }

        PlayerStatsController.instance.decreaseMoney(course.cost);
        this.currentCourse = course;
        this.weeksRemaining = course.timeRequired; // Weeks remaining for the course

        import { Course } from './Course';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';

class EducationManager {
    private static instance: EducationManager;
    private currentCourse: Course | null = null; // Reference to the player's current course
    private weeksRemaining: number = 0; // Weeks remaining for the current course

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): EducationManager {
        if (!EducationManager.instance) {
            EducationManager.instance = new EducationManager();
        }
        return EducationManager.instance;
    }

    public getCurrentCourse(): Course | null {
        return this.currentCourse;
    }

    public getWeeksRemaining(): number {
        return this.weeksRemaining;
    }

    public enrollCourse(course: Course): boolean {
        const playerData = PlayerStatsController.instance.getPlayerData();

        if (this.currentCourse) {
            console.warn("Already enrolled in a course. Complete current course first.");
            return false;
        }

        if (playerData.currentEducationLevel < course.prerequisiteEducationLevel) {
            console.warn(`Cannot enroll in ${course.courseName}. Prerequisite education level not met. Needed: ${course.prerequisiteEducationLevel}, Have: ${playerData.currentEducationLevel}`);
            return false;
        }

        if (playerData.money < course.cost) {
            console.warn(`Not enough money to enroll in ${course.courseName}. Cost: ${course.cost}, Have: ${playerData.money}`);
            return false;
        }

        const timeCostInHours = course.timeRequired * 40; // Example conversion

        if (!TurnManager.instance.trySpendTime(timeCostInHours)) {
            console.warn(`Not enough time to enroll in ${course.courseName}. Time needed: ${timeCostInHours}, Remaining: ${TurnManager.instance.timeBudget}`);
            return false;
        }

        PlayerStatsController.instance.decreaseMoney(course.cost);
        this.currentCourse = course;
        this.weeksRemaining = course.timeRequired;

        PlayerStatsController.instance.updateCurrentCourse(course);

        GlobalEventEmitter.instance.emit('onCourseEnrolled', course);
        console.log(`Enrolled in course: ${course.courseName}. Weeks remaining: ${this.weeksRemaining}`);
        return true;
    }

    private handleWeekStart(currentWeek: number): void {
        if (this.currentCourse) {
            this.weeksRemaining--;
            if (this.weeksRemaining <= 0) {
                // Course completed
                PlayerStatsController.instance.updateCurrentEducationLevel(PlayerStatsController.instance.getPlayerData().currentEducationLevel + this.currentCourse.educationGain);
                PlayerStatsController.instance.updateCurrentCourse(null); // Clear current course
                const completedCourse = this.currentCourse;
                this.currentCourse = null;
                GlobalEventEmitter.instance.emit('onCourseCompleted', completedCourse);
                console.log(`Course ${completedCourse.courseName} completed! Education gained: ${completedCourse.educationGain}`);
            } else {
                console.log(`Course ${this.currentCourse.courseName}: ${this.weeksRemaining} weeks remaining.`);
            }
        }
    }

    // TODO: Implement EducationManager logic here
}
