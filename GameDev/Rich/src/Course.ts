// GameDev/Rich/src/Course.ts
export interface Course {
    id: string;
    courseName: string;
    description: string;
    cost: number;
    timeRequired: number; // In weeks
    educationGain: number;
    prerequisiteEducationLevel: number;
}
