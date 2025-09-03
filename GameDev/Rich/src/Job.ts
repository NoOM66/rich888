// GameDev/Rich/src/Job.ts
export interface Job {
    id: string;
    jobName: string;
    description: string;
    baseSalary: number;
    stressPerWeek: number;
    happinessChangePerWeek: number;
    timeCost: number; // Hours per week
    educationRequirement: number; // Minimum education level
    promotionEducationRequirement: number; // Education needed for next level
    promotionExperienceRequirement: number; // Experience needed for next level
    nextJobLevelId: string | null; // ID of the next job in the career path, null if no next level
}
