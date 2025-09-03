// GameDev/Rich/src/CoursesData.ts
import { Course } from './Course';

export const Courses: Course[] = [
    {
        id: 'basic_math',
        courseName: 'คณิตศาสตร์พื้นฐาน',
        description: 'คอร์สพื้นฐานสำหรับเพิ่มทักษะคณิตศาสตร์',
        cost: 100,
        timeRequired: 2, // 2 weeks
        educationGain: 5,
        prerequisiteEducationLevel: 0,
    },
    {
        id: 'advanced_programming',
        courseName: 'การเขียนโปรแกรมขั้นสูง',
        description: 'คอร์สสำหรับนักพัฒนาที่ต้องการเพิ่มทักษะการเขียนโปรแกรม',
        cost: 500,
        timeRequired: 4, // 4 weeks
        educationGain: 20,
        prerequisiteEducationLevel: 10,
    },
    // Add more courses as needed
];
