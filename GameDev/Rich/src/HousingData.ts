// GameDev/Rich/src/HousingData.ts
import { Housing } from './Housing';

export const HousingOptions: Housing[] = [
    {
        id: 'small_apartment',
        homeName: 'อพาร์ตเมนต์ขนาดเล็ก',
        description: 'ที่อยู่อาศัยเริ่มต้น ราคาประหยัด',
        baseRent: 100,
        baseUtilitiesCost: 20,
        capacity: 1,
        happinessBonus: 5,
        upgradeOptionId: 'medium_apartment',
    },
    {
        id: 'medium_apartment',
        homeName: 'อพาร์ตเมนต์ขนาดกลาง',
        description: 'ที่อยู่อาศัยที่กว้างขึ้น สะดวกสบายขึ้น',
        baseRent: 250,
        baseUtilitiesCost: 40,
        capacity: 2,
        happinessBonus: 10,
        upgradeOptionId: 'house',
    },
    {
        id: 'house',
        homeName: 'บ้าน',
        description: 'บ้านเดี่ยวขนาดใหญ่ มีพื้นที่ใช้สอยมาก',
        baseRent: 500,
        baseUtilitiesCost: 80,
        capacity: 4,
        happinessBonus: 20,
        upgradeOptionId: null,
    },
];
