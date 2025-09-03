import { Loan } from './Loan';
import { Job } from './Job';
import { Course } from './Course';
import { Location } from './Location';
import { Housing } from './Housing';

export interface PlayerData {
  money: number;
  health: number;
  happiness: number;
  education: number;
  stress: number;
  bankBalance: number; // New
  activeLoans: Loan[]; // New
  investmentHoldings: { [assetId: string]: number }; // New
  currentJob: Job | null; // New
  jobExperience: number; // New
  currentCourse: Course | null; // New
  currentEducationLevel: number; // New
  currentLocation: Location | null; // New
  currentHome: Housing | null; // New
}

export const DefaultPlayerData: PlayerData = {
  money: 1000,
  health: 100,
  happiness: 100,
  education: 0,
  stress: 0,
  bankBalance: 0, // Default value
  activeLoans: [], // Default value
  investmentHoldings: {}, // Default value
  currentJob: null, // Default value
  jobExperience: 0, // Default value
  currentCourse: null, // Default value
  currentEducationLevel: 0, // Default value
  currentLocation: null, // Default value
  currentHome: null, // Default value
};