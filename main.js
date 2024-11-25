const { parseFile } = require('./parser');
const fs = require('fs');

const scheduleAB = parseFile('./SujetA_data/AB/edt.cru');
console.log(scheduleAB);


function parseAllFiles() {
    const scheduleAll = {};
    const files = fs.readdirSync('./SujetA_data');
    files.forEach(file => {
        const schedule = parseFile(`./SujetA_data/${file}/edt.cru`);
        scheduleAll[file] = schedule;
    });
    return scheduleAll;
}

const scheduleAll = parseAllFiles();
console.log(scheduleAll);


//Fonctionnalités à implémenter
// 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités 
// 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle
// 3. Rechercher les salles et les créneaux horaires d'un cours donné 
// 4. Trouver la capacité maximale d'une salle donnée
// 5. Classer les salles par capacité d'accueil max 
// 6. Visualiser le taux d'occupation des salles 
// 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 


// 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités
function isRoomOccupied(schedule, room, time) {
    const courses = Object.values(schedule).flat();
    return courses.some(course => course.room === room && course.time === time);
}

function getRoomCapacity(schedule, room) {
    const courses = Object.values(schedule).flat();
    return Math.max(...courses.filter(course => course.room === room).map(course => course.capacity));
}

function findAvailableRooms(schedule, time, capacity) {
    const courses = Object.values(schedule).flat();
    const rooms = [...new Set(courses.map(course => course.room))];
    return rooms.filter(room => !isRoomOccupied(schedule, room, time) && getRoomCapacity(schedule, room) >= capacity);
}

console.log(findAvailableRooms(scheduleAB, 'J 10:00-12:00', 20));