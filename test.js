const {isRoomOccupied, isRoomAvailable, getRoomCapacity, findAvailableRooms, findAvailableSlots, findCourseSchedulege, RoomsByCapcity} = require('./main.js');

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
            capacity: 25,
            time: 'J 10:00-12:00',
            group: 'F1',
            room: 'S204'
          }]; 
    });

    describe


});