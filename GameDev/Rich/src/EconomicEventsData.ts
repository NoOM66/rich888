// GameDev/Rich/src/EconomicEventsData.ts
import { EconomicEvent, EconomicEventType } from './EconomicEvent';

export const EconomicEvents: EconomicEvent[] = [
    {
        id: 'oil_price_hike',
        eventName: 'ราคาน้ำมันพุ่งสูงขึ้น',
        description: 'ราคาน้ำมันโลกปรับตัวสูงขึ้นอย่างรวดเร็ว ส่งผลให้ค่าครองชีพเพิ่มขึ้น',
        eventType: EconomicEventType.Negative,
        triggerChancePerWeek: 0.05, // 5% chance per week
        moneyChange: -100, // Example: reduce money
        inflationRateChange: 0.005, // Example: increase inflation by 0.5%
    },
    {
        id: 'government_stimulus',
        eventName: 'รัฐบาลแจกเงินกระตุ้นเศรษฐกิจ',
        description: 'รัฐบาลออกมาตรการกระตุ้นเศรษฐกิจด้วยการแจกเงินให้ประชาชน',
        eventType: EconomicEventType.Positive,
        triggerChancePerWeek: 0.03, // 3% chance per week
        moneyChange: 200, // Example: increase money
    },
    {
        id: 'stock_market_crash',
        eventName: 'ตลาดหุ้นล่ม',
        description: 'ตลาดหุ้นทั่วโลกดิ่งลงอย่างรุนแรง ส่งผลกระทบต่อการลงทุน',
        eventType: EconomicEventType.Negative,
        triggerChancePerWeek: 0.02, // 2% chance per week
        moneyChange: -500, // Example: reduce money
        // This event would also affect investment holdings, but that's not in this story's scope
    },
];
