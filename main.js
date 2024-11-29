const { yellow, red, green } = require('colors');
const { parseFile } = require('./parser');
const fs = require('fs');

// Function to parse the files 
function parseAllFiles(folderPath) {
    const allCourses = [];
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
        const courses = parseFile(`./SujetA_data/${file}/edt.cru`);
        allCourses.push(...courses);
    
    });

    return allCourses;
}








//Fonctionnalités à implémenter
// Aurélien 0. Faire le menu 
// Lila 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités 
// Aurélien 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle
// Maé 3. Rechercher les salles et les créneaux horaires d'un cours donné 
// Fait 4. Trouver la capacité maximale d'une salle donnée
// Mae 5. Classer les salles par capacité d'accueil max 
// Lila 6. Visualiser le taux d'occupation des salles 
// 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 




// Lila 1. Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités
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






// Aurélien 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle

function findAvailableSlots(schedule, salle) {
    const creneaux = [];
    const courses = Object.values(schedule);

    for (const course of courses) {
        if (course.room === salle) {
            creneaux.push(course.time);
        }
    }
    return creneaux.sort();
}

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








// Lila 4. Trouver la capacité maximale d'une salle donnée (Etape utilisée en 1)
// Mae 5. Classer les salles par capacité d'accueil max 

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







// Lila 6. Visualiser le taux d'occupation des salles 

function getNumberOccupation(schedule) {
    const roomHoursOccupancy = {};  // Dictionary to store room ID and its occupation count
    const percentageOccupancy = {};  // Dictionary to store room ID and its occupation percentage
    const courses = Object.values(schedule);
    courses.sort((a, b) => a.room.localeCompare(b.room));
    
    for (const course of courses) {
        if (!roomHoursOccupancy[course.room]) {
            roomHoursOccupancy[course.room] = 0;        
        }
        roomHoursOccupancy[course.room]+=2;  // Increment the count for this room
    }
    for (const course of courses){
        percentageOccupancy[course.room] = (roomHoursOccupancy[course.room] / 60) * 100;
    }
    
    return [roomHoursOccupancy, percentageOccupancy];  // Return the dictionary with room IDs and their occupation counts
}







// 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 



// Tests

function test() {
    const scheduleAll = parseAllFiles('./SujetA_data');
    //test 1 
    console.log(isRoomOccupied(scheduleAll, 'P101', 'ME 10:00-12:00')); 
    console.log(getRoomCapacity(scheduleAll, 'B103'));
    console.log(findAvailableRooms(scheduleAll, 'ME 10:00-12:00', 30));

    //test 3
    const sortedResult = findCourseSchedule(scheduleAll, 'AP03');
    //Affichage des des salles et créneaux horaires d'un cours
    console.log(sortedResult);

    //test 5
    const sortedRooms = geRoomsByCapcity(scheduleAll);
    //Affichage des salles triées par capacité
    console.log(sortedRooms);

    //test 6
    const [roomHoursOccupancy, percentageOccupancy] = getNumberOccupation(scheduleAll);
    console.log(roomHoursOccupancy);
    console.log(percentageOccupancy);

}


const question = require('prompt-sync')({sigint: true});


function MenuPrincipal() {
    const scheduleAll = parseAllFiles('./SujetA_data');
    console.log("\n=== Menu Principal ===".yellow);
    console.log("1. Afficher les créneaux disponibles d'une salle donnée");
    console.log("2. Afficher si une salle est occupée à un créneau donné");
    console.log("3. Afficher les salles et créneaux horaires d'un cours donné");
    console.log("4. Afficher les salles disponibles à un créneau et une capacité donnés");//Important d'avoir la capacité ?
    console.log("5. Afficher les salles triées par capacité");
    console.log("6. Visualiser le taux d'occupation des salles");
    console.log("7. Générer un fichier iCalendar");
    console.log("8. Afficher la capacité maximale d'une salle donnée");
    console.log("\n9. Quitter");
    console.log("=======================".yellow);

    let option = question("Choisissez une option: ");
    switch (option.trim()) {
        case "1":
            let salle1 = question("\tSalle (ex : P101): ");
            let capacity = getRoomCapacity(scheduleAll, salle1);
            console.log("La salle ".cyan+salle1.cyan+" (".cyan+ capacity.toString().cyan +" places) est disponibles aux crénaux:".cyan);
            for (let crenau of findAvailableSlots(scheduleAll, salle1)) {
                console.log("\t- ".cyan+crenau.cyan);
            }
            break;
        case "2":
            let salle2 = question("\tSalle (ex : P101): ");
            let heure = question("\tHoraire (ex : ME 10:00-12:00) : ");
                if (isRoomOccupied(scheduleAll, salle2, heure)) {
                    console.log(`La salle ${salle2} est occupée à ${heure}`.red);
                    console.log("RECHERCHER QUEL COURS OCCUPE")
                } else {
                    console.log(`La salle ${salle2} est libre à ${heure}`.green);
                }
            
            break;
        case "3":
            let cours = question("\tNom du cours (ex : AP03): ");
            console.log(findCourseSchedule(scheduleAll, cours));//Pas fonctionnel
            break; 
        case "4":
            let heure2 = question("\tHoraire (ex : ME 10:00-12:00) : ");
            let capacite = question("\tCapacité : ");

            console.log(`Voici les salles de ${capacite} places disponibles à ${heure2}`.cyan);
            for (let salle of findAvailableRooms(scheduleAll, heure2, capacite)) {
                console.log("\t- ".cyan+salle.cyan);
            }
            break;
        case "5":
            console.log(geRoomsByCapcity(scheduleAll));// Pas fonctionnel
            break;
        case "8":
            let salle3 = question("\tSalle (ex : P101): ");
            console.log("La salle "+salle3+" a une capacité de "+getRoomCapacity(scheduleAll, salle3)+" places.", yellow);
            break;
            
    MenuPrincipal();
        }
}


MenuPrincipal();

//test();