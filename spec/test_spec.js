const {isRoomOccupied, getRoomCapacity, findAvailableRooms, findAvailableSlots, geRoomsByCapcity, getNumberOccupation, findCourseSchedule} = require('../main.js');

// Test cases

describe ("Test cases for schedule project ", () => {
    let sampleSchedule; 
    beforeEach(() => {
        sampleSchedule = [{
            courseId: 'AP03',
            index: 1,
            type: 'D2',
            capacity: 24,
            time: 'V 13:00-16:00',
            group: 'F1',
            room: 'B103'
          },
          {
            courseId: 'BI01',
            index: 1,
            type: 'C1',
            capacity: 25,
            time: 'ME 8:00-10:00',
            group: 'F1',
            room: 'P101'
          },
          {
            courseId: 'CL10',
            index: 1,
            type: 'D2',
            capacity: 30,
            time: 'J 10:00-12:00',
            group: 'F1',
            room: 'P101'
          }]; 
    });

    describe ("SPEC 1 - Afficher les salles dispo sur un créneau" , () => {
        it ('should return true if the room is occupied', () => {
            expect(isRoomOccupied(sampleSchedule, 'B103', 'V 13:00-16:00')).toBe(true);
        }); 
        it ('should return false if the room is not occupied', () => {
            expect(isRoomOccupied(sampleSchedule, 'B103', 'V 16:00-19:00')).toBe(false);
        }); 
        it ('should return availables rooms', () => {
            expect(findAvailableRooms(sampleSchedule, 'V 13:00-16:00')).toEqual(['P101']);
        }); 

    });

    describe ("SPEC 2 - accèder aux créneaux d'une salle" , () => {
        it ('should return the time slots of a room', () => {
            expect(findAvailableSlots(sampleSchedule, 'P101')).toEqual(['ME 8:00-10:00', 'J 10:00-12:00']);
        }); 
    
    });

    describe ("SPEC 3 - accèder aux cours d'une salle" , () => {
        it ('should return the courses scheduled in a room', () => {
            expect(findCourseSchedule(sampleSchedule, 'P101')).toEqual(['BI01', 'CL10']);
        }); 
        it ('should not work if the course does not exist', () => {
            expect(findCourseSchedule(sampleSchedule, 'P102')).toEqual([]);
        }); 
    
    });

    describe ("SPEC 4 - accèder à la capacité d'une salle" , () => {
        it ('should return the capacity of a room ', () => {
            expect(getRoomCapacity(sampleSchedule, 'P101')).toEqual(30);
        }); 
        it ('should return 0 if the room does not exist', () => {
            expect(getRoomCapacity(sampleSchedule, 'P102')).toEqual(0);
        }); 
    
    });

    describe ("SPEC 5 - accèder aux salles par capacité" , () => {
        it ('should return the rooms by capacity', () => {
            expect(geRoomsByCapcity(sampleSchedule)).toEqual([{ room: 'P101', capacity: 30 },{ room: 'B103', capacity: 24 } ]);
        });
    }); 

    describe ("SPEC 6 - visualiser le taux d'occupation" , () => {
        it ('should return the occupation rate of the rooms', () => {
            expect(getNumberOccupation(sampleSchedule)).toEqual([{ B103: 2, P101: 4 }, { B103: 3.3333333333333335, P101: 6.666666666666667}]);
        }); 
    });

    


});