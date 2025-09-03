// GameDev/Rich/src/LocationsData.ts
import { Location } from './Location';
import { Activity } from './Activity'; // Assuming Activity interface

// Placeholder for Activity, will be properly defined in a later story if needed
const placeholderActivities: Activity[] = [
    { id: 'work', name: 'ทำงาน' },
    { id: 'study', name: 'เรียนหนังสือ' },
    { id: 'bank_service', name: 'ทำธุรกรรมธนาคาร' },
    { id: 'shop_food', name: 'ซื้ออาหาร' },
];

export const Locations: Location[] = [
    {
        id: 'home',
        locationName: 'บ้าน',
        description: 'ที่พักอาศัยของคุณ',
        availableActivities: [
            placeholderActivities[0],
            placeholderActivities[1],
        ],
    },
    {
        id: 'workplace',
        locationName: 'ที่ทำงาน',
        description: 'สถานที่ที่คุณทำงาน',
        availableActivities: [
            placeholderActivities[0],
        ],
    },
    {
        id: 'bank',
        locationName: 'ธนาคาร',
        description: 'สถานที่สำหรับทำธุรกรรมทางการเงิน',
        availableActivities: [
            placeholderActivities[2],
        ],
    },
    {
        id: 'supermarket',
        locationName: 'ซูเปอร์มาร์เก็ต',
        description: 'สถานที่สำหรับซื้ออาหารและของใช้จำเป็น',
        availableActivities: [
            placeholderActivities[3],
        ],
    },
];
