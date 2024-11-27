const { parseFile } = require('./parser');
const fs = require('fs');



function parseAllFiles(folderPath) {
    const allCourses = [];
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
        const courses = parseFile(`./SujetA_data/${file}/edt.cru`);
        allCourses.push(...courses);
    
    });

    return allCourses;
}

const scheduleAll = parseAllFiles('./SujetA_data');

//console.log(scheduleAll);



//Fonctionnalités à implémenter
// Aurélien 0. Faire le menu 
// Lila 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités 
// Aurélien 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle
// Maé 3. Rechercher les salles et les créneaux horaires d'un cours donné 
// Fait 4. Trouver la capacité maximale d'une salle donnée
// 5. Classer les salles par capacité d'accueil max 
// 6. Visualiser le taux d'occupation des salles 
// 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 


// 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités
function isRoomOccupied(schedule, room, time) {
    const courses = Object.values(schedule);
    for (let course of courses) {
        if (course.room === room && course.time === time) {
            return true;
        }
    }
    return false;
}

function getRoomCapacity(schedule, room) {
    const courses = Object.values(schedule); 
    let maxCapacity = 0;
    for (let course of courses) {
        if (course.room === room && course.capacity > maxCapacity) {
            maxCapacity = course.capacity;
        }
    }
    return maxCapacity;
}

function findAvailableRooms(schedule, time, capacity) {
    const listRooms = [];
    const availableRooms = [];
    const courses = Object.values(schedule);

    for (const course of courses) {
        if (!listRooms.includes(course.room)) {
            console.log(course.room);
            listRooms.push(course.room);
        }  
    }

    for (const room of listRooms) {
        const roomOccupied = isRoomOccupied(schedule, room, time);
        const roomCapacity = getRoomCapacity(schedule, room);

        if (!roomOccupied && roomCapacity >= capacity) {
            availableRooms.push(room);
        }
    }

    return availableRooms;
}

//console.log(findAvailableRooms(scheduleAB, 'J 10:00-12:00', 20));
console.log(isRoomOccupied(scheduleAll, 'P101', 'ME 10:00-12:00')); 
console.log(getRoomCapacity(scheduleAll, 'B103'));
console.log(findAvailableRooms(scheduleAll, 'ME 10:00-12:00', 30));



















// Aurélien 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle

// Maé 3. Rechercher les salles et les créneaux horaires d'un cours donné 

// Fonction pour rechercher les salles et créneaux horaires d'un cours donné
function findCourseSchedule(schedule, courseName) {
    const result = [];

    // Parcours de tous les cours dans le planning
    Object.values(schedule).forEach(courseList => {
        courseList.forEach(course => {
            // Si le nom du cours correspond à celui recherché
            if (courseName.toLowerCase() === course.toLowerCase()) {
                result.push({
                    room: course.room,
                    time: course.time
                });
            }
        });
    });

    return result;
}

// Appel de la fonction
//const sortedResult = findCourseSchedule(schedule, courseName);

// Affichage des des salles et créneaux horaires d'un cours
//console.log(sortedResult);

// 4. Trouver la capacité maximale d'une salle donnée (Etape utilisée en 1)
// 5. Classer les salles par capacité d'accueil max 

//Fonction qui classe les salles en fonction de leur capacité d'accueil
function geRoomsByCapcity(schedule) {
    const rooms = [];

    // Parcours de tous les cours dans le planning
    Object.values(schedule).forEach(courseList => {
        courseList.forEach(course => {
            // Ajouter la salle avec sa capacité au tableau rooms
                rooms.push({
                    room: course.room,
                    capacity: course.capacity
                });
        });
    });

    // Trier les salles par capacité (du plus grand au plus petit)
    rooms.sort((a, b) => b.capacity - a.capacity);

    return rooms;
}

// Appel de la fonction
//const sortedRooms = getRoomsByCapacity(schedule);

// Affichage des salles triées
//console.log(sortedRooms);

// 6. Visualiser le taux d'occupation des salles 
// 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 

