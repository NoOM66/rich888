// GameDev/Rich/src/JobsData.ts
import { Job } from './Job';

export const Jobs: Job[] = [
    {
        id: 'part_time_worker',
        jobName: 'พนักงานพาร์ทไทม์',
        description: 'งานเริ่มต้นที่ใช้เวลาไม่มากนัก แต่รายได้น้อย',
        baseSalary: 500,
        stressPerWeek: 5,
        happinessChangePerWeek: -2,
        timeCost: 20,
        educationRequirement: 0,
        promotionEducationRequirement: 10,
        promotionExperienceRequirement: 5,
        nextJobLevelId: 'junior_staff',
    },
    {
        id: 'junior_staff',
        jobName: 'พนักงานระดับต้น',
        description: 'งานประจำที่ต้องใช้ทักษะพื้นฐาน รายได้ปานกลาง',
        baseSalary: 1500,
        stressPerWeek: 10,
        happinessChangePerWeek: -5,
        timeCost: 40,
        educationRequirement: 10,
        promotionEducationRequirement: 30,
        promotionExperienceRequirement: 15,
        nextJobLevelId: null, // For now, no next level
    },
    // Add more jobs as needed
];
