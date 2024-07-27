import { Dungeon } from "../dungeon.ts";

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * AI TRASH TO GET STARTED
 */
export function generateRandomDungeon(width: number, height: number): Dungeon {
    // Initialize the dungeon map with walls
    const dungeon: Dungeon = [];
    for (let y = 0; y < height; y++) {
        dungeon[y] = [];
        for (let x = 0; x < width; x++) {
            dungeon[y][x] = 0;
        }
    }
    // JUST a damn empty room this needs work
    return dungeon;

    // List to store rooms
    const rooms: Room[] = [];

    // Function to add a room to the dungeon
    function addRoom(room: Room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                dungeon[y][x] = 0; // Set cells of the room to floor
            }
        }
        rooms.push(room);
    }

    // Function to connect two rooms with corridors
    function connectRooms(room1: Room, room2: Room) {
        let x1 = Math.floor(room1.x + room1.width / 2);
        let y1 = Math.floor(room1.y + room1.height / 2);
        const x2 = Math.floor(room2.x + room2.width / 2);
        const y2 = Math.floor(room2.y + room2.height / 2);

        while (x1 !== x2 || y1 !== y2) {
            if (x1 !== x2) {
                x1 += x1 < x2 ? 1 : -1;
                dungeon[y1][x1] = 0; // Create horizontal corridor
            } else {
                y1 += y1 < y2 ? 1 : -1;
                dungeon[y1][x1] = 0; // Create vertical corridor
            }
        }
    }

    // Generate rooms
    const numRooms = 20; // Adjust the number of rooms as needed
    const minRoomSize = 3;
    const maxRoomSize = 6;

    for (let i = 0; i < numRooms; i++) {
        const roomWidth =
            Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) +
            minRoomSize;
        const roomHeight =
            Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) +
            minRoomSize;
        const x = Math.floor(Math.random() * (width - roomWidth - 1)) + 1;
        const y = Math.floor(Math.random() * (height - roomHeight - 1)) + 1;
        const newRoom: Room = { x, y, width: roomWidth, height: roomHeight };

        // Check for overlap with existing rooms
        const overlaps = rooms.some((room) => {
            return (
                newRoom.x < room.x + room.width &&
                newRoom.x + newRoom.width > room.x &&
                newRoom.y < room.y + room.height &&
                newRoom.y + newRoom.height > room.y
            );
        });

        if (!overlaps) {
            addRoom(newRoom);
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        connectRooms(rooms[i - 1], rooms[i]);
    }

    return dungeon;
}
