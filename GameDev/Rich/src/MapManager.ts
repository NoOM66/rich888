import { Location } from './Location';
import { Path } from './Path';
import { Locations } from './LocationsData';
import { Paths } from './PathsData';
import { PlayerStatsController } from './PlayerStatsController'; // Import PlayerStatsController
import { GlobalEventEmitter } from './GlobalEventEmitter'; // Import GlobalEventEmitter
import { TurnManager } from './TurnManager'; // Import TurnManager

class MapManager {
    private static instance: MapManager;
    private locations: Location[] = Locations;
    private paths: Path[] = Paths;
    private currentLocation: Location | null = null; // Reference to the player's current location

    private constructor() {
        // Private constructor to prevent direct instantiation
        // Initialize current location to Home by default
        this.currentLocation = Locations.find(loc => loc.id === 'home') || null;
        // Update PlayerData with initial location
        PlayerStatsController.instance.updateCurrentLocation(this.currentLocation);
    }

    public static getInstance(): MapManager {
        if (!MapManager.instance) {
            MapManager.instance = new MapManager();
        }
        return MapManager.instance;
    }

    public getCurrentLocation(): Location | null {
        return this.currentLocation;
    }

    public getLocationById(id: string): Location | undefined {
        return this.locations.find(loc => loc.id === id);
    }

    public getPathsFromLocation(fromLocationId: string): Path[] {
        return this.paths.filter(path => path.fromLocationId === fromLocationId);
    }

    public tryTravelTo(destination: Location): boolean {
        if (!this.currentLocation) {
            console.warn("Player has no current location.");
            return false;
        }

        const path = this.paths.find(p => p.fromLocationId === this.currentLocation?.id && p.toLocationId === destination.id);

        if (!path) {
            console.warn(`No direct path from ${this.currentLocation.locationName} to ${destination.locationName}.`);
            return false;
        }

        GlobalEventEmitter.instance.emit('onTravelStarted', this.currentLocation, destination, path.travelTimeCost);

        if (!TurnManager.instance.trySpendTime(path.travelTimeCost)) {
            console.warn(`Not enough time to travel to ${destination.locationName}. Time needed: ${path.travelTimeCost}, Remaining: ${TurnManager.instance.timeBudget}`);
            return false;
        }

        // Travel successful
        this.currentLocation = destination;
        PlayerStatsController.instance.updateCurrentLocation(destination);
        GlobalEventEmitter.instance.emit('onTravelCompleted', destination);
        console.log(`Successfully traveled to ${destination.locationName}.`);
        return true;
    }

    // TODO: Implement MapManager logic here
}
