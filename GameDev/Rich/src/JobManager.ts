import { Job } from './Job';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { Jobs } from './JobsData'; // Import Jobs data

class JobManager {
    private static instance: JobManager;
    private currentJob: Job | null = null; // Reference to the player's current job

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): JobManager {
        if (!JobManager.instance) {
            JobManager.instance = new JobManager();
        }
        return JobManager.instance;
    }

    public getCurrentJob(): Job | null {
        return this.currentJob;
    }

    public selectJob(job: Job): boolean {
        const playerData = PlayerStatsController.instance.getPlayerData();
        if (playerData.education < job.educationRequirement) {
            console.warn(`Cannot select job ${job.jobName}. Education requirement not met. Needed: ${job.educationRequirement}, Have: ${playerData.education}`);
            return false;
        }

        this.currentJob = job;
        PlayerStatsController.instance.updateCurrentJob(job);

        GlobalEventEmitter.instance.emit('onJobSelected', job);
        console.log(`Job selected: ${job.jobName}`);
        return true;
    }

    private handleWeekStart(currentWeek: number): void {
        if (this.currentJob) {
            // Apply salary
            PlayerStatsController.instance.addMoney(this.currentJob.baseSalary);
            GlobalEventEmitter.instance.emit('onSalaryReceived', this.currentJob.baseSalary);

            // Apply stat changes
            PlayerStatsController.instance.applyStressChange(this.currentJob.stressPerWeek);
            PlayerStatsController.instance.applyHappinessChange(this.currentJob.happinessChangePerWeek);

            // Spend time
            TurnManager.instance.trySpendTime(this.currentJob.timeCost);

            // Increase job experience
            PlayerStatsController.instance.updateJobExperience(PlayerStatsController.instance.getPlayerData().jobExperience + 1); // Assuming 1 experience per week

            console.log(`Weekly work for ${this.currentJob.jobName} processed.`);
        }
    }

    public canPromote(): boolean {
        if (!this.currentJob || !this.currentJob.nextJobLevelId) {
            return false; // No current job or no next level
        }

        const playerData = PlayerStatsController.instance.getPlayerData();
        const nextJob = Jobs.find(job => job.id === this.currentJob?.nextJobLevelId);

        if (!nextJob) {
            console.warn(`Next job level with ID ${this.currentJob.nextJobLevelId} not found.`);
            return false;
        }

        return playerData.education >= nextJob.promotionEducationRequirement &&
               playerData.jobExperience >= nextJob.promotionExperienceRequirement;
    }

    public promote(): boolean {
        if (!this.canPromote()) {
            console.warn("Cannot promote. Requirements not met or no next job level.");
            return false;
        }

        const nextJob = Jobs.find(job => job.id === this.currentJob?.nextJobLevelId);
        if (!nextJob) {
            // This case should ideally be caught by canPromote, but for safety
            console.error("Next job level not found during promotion.");
            return false;
        }

        this.currentJob = nextJob;
        PlayerStatsController.instance.updateCurrentJob(nextJob);
        PlayerStatsController.instance.updateJobExperience(0); // Reset experience after promotion

        GlobalEventEmitter.instance.emit('onPromoted', nextJob);
        console.log(`Promoted to: ${nextJob.jobName}`);
        return true;
    }

    public quitJob(): void {
        if (this.currentJob) {
            const oldJob = this.currentJob;
            this.currentJob = null;
            PlayerStatsController.instance.updateCurrentJob(null);
            PlayerStatsController.instance.updateJobExperience(0); // Reset experience on quitting
            GlobalEventEmitter.instance.emit('onJobQuit', oldJob);
            console.log(`Quit job: ${oldJob.jobName}`);
        } else {
            console.warn("No job to quit.");
        }
    }

    // Optional: public getFired(): void { ... }
}
