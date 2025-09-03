// GameDev/Rich/src/Location.ts
import { Activity } from './Activity'; // Assuming Activity interface will be defined later

export interface Location {
    id: string;
    locationName: string;
    description: string;
    availableActivities: Activity[]; // List of activities available at this location
}
