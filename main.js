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

//relier au menu 
//faire fonction qui récupere la path du dossier data 
// fonctionnalité rapport conflits de données 
// test unitaires



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
            //console.log(course.room);
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


function getCoursesByRoomAndSlot(schedule, salle,crenau) {
    const courses = Object.values(schedule);
    const coursesList = [];

    for (const course of courses) {
        if (course.room === salle && course.time === crenau) {
            return course.courseId;
        }
    }
}

// Maé 3. Rechercher les salles et les créneaux horaires d'un cours donné 

// Fonction pour rechercher les salles et créneaux horaires d'un cours donné
function findCourseSchedule(schedule, courseName) {
    const result = [];

    // Parcours de tous les cours dans le planning
    Object.values(schedule).forEach(course => {
            // Si le nom du cours correspond à celui recherché
            if (courseName.toLowerCase() === course.courseId.toLowerCase()) {
                result.push({
                    room: course.room,
                    time: course.time
                });
            }
        //});
    });

    return result;
}








// Lila 4. Trouver la capacité maximale d'une salle donnée (Etape utilisée en 1)
// Mae 5. Classer les salles par capacité d'accueil max 

//Fonction qui classe les salles en fonction de leur capacité d'accueil
function geRoomsByCapcity(schedule) {
    const rooms = [];
    const roomsNames=[]; //Contient le nom des salles déja ajoutées au tableau rooms

    // Parcours de tous les cours dans le planning
    Object.values(schedule).forEach(course=> {
        //courseList.forEach(course => {

            //Si la salle n'a pas été traitées
            if (!roomsNames.includes(course.room)){
                // Ajouter la salle avec sa capacité au tableau rooms
                rooms.push({
                    room: course.room,
                    capacity: getRoomCapacity(schedule, course.room)
                });
                // Ajouter la salle dans la liste de celles déja traitées
                roomsNames.push(course.room);
            }
        //});
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
const chalk = require('chalk');//Permet de gerer les couleurs du texte

const couleurTitre= chalk.hex('#BCA12D');
const couleurTexteMenu= chalk.hex('#edfbc1');
const couleurQuestion= chalk.hex('#858031');
const couleurReponse= chalk.hex('#d9d375');
const couleurRouge= chalk.hex('#ff0000');
const couleurVert= chalk.hex('#00ff00');

function MenuPrincipal() {
    const scheduleAll = parseAllFiles('./SujetA_data');

    console.log(couleurTitre("\n╔════════════════════════════════════╗"));
    console.log(couleurTitre("║           MENU PRINCIPAL           ║"));
    console.log(couleurTitre("╠════════════════════════════════════╝"));
    console.log(couleurTexteMenu("║      [1] Afficher les créneaux disponibles d'une salle donnée"));
    console.log(couleurTexteMenu("║      [2] Afficher si une salle est occupée à un créneau donné"));
    console.log(couleurTexteMenu("║      [3] Afficher les salles et créneaux horaires d'un cours donné"));
    console.log(couleurTexteMenu("║      [4] Afficher les salles disponibles à un créneau et une capacité donnés"));//Important d'avoir la capacité ?
    console.log(couleurTexteMenu("║      [5] Afficher les salles triées par capacité"));
    console.log(couleurTexteMenu("║      [6] Visualiser le taux d'occupation des salles"));
    console.log(couleurTexteMenu("║      [7] Générer un fichier iCalendar"));
    console.log(couleurTexteMenu("║      [8] Afficher la capacité maximale d'une salle donnée"));
    console.log(couleurTexteMenu("║\n║      [9] Quitter"));
    console.log(couleurTitre("╚═══════════════════════════════════"));

    let option = question(couleurQuestion("Choisissez une option: "));
    switch (option.trim()) {
        default:
            console.log(couleurRouge("Veuillez choisir une option valide"));
            break;

        case "1":
            let salle1 = question(couleurQuestion("\tSalle (ex : P101): "));
            let capacity = getRoomCapacity(scheduleAll, salle1);
            console.log(couleurReponse("La salle "+salle1+" ("+ capacity.toString() +" places) est disponibles aux crénaux:"));
            for (let crenau of findAvailableSlots(scheduleAll, salle1)) {
                console.log(couleurReponse("\t- "+crenau));
            }
            break;
        case "2":
            let salle2 = question(couleurQuestion("\tSalle (ex : P101): "));
            let heure = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
                if (isRoomOccupied(scheduleAll, salle2, heure)) {
                    console.log(couleurRouge(`La salle ${salle2} est occupée à ${heure}`+" par le cours "+getCoursesByRoomAndSlot(scheduleAll, salle2, heure)));
                } else {
                    console.log(couleurVert(`La salle ${salle2} est libre à ${heure}`));
                }
            
            break;
        case "3":
            let cours = question(couleurQuestion("\tNom du cours (ex : AP03): "));
            console.log(couleurReponse(`Voici les crénaux et salles de cours de l'UE ${cours}`));
            for (let creneau of findCourseSchedule(scheduleAll, cours)) {
                console.log(couleurReponse(`\t- Crénaux : ${creneau.time} ; Salle : ${creneau.room}`));
            }
            break; 
        case "4":
            let heure2 = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
            let capacite = question(couleurQuestion("\tCapacité : "));

            console.log(couleurReponse(`Voici les salles de ${capacite} places disponibles à ${heure2}`));
            for (let salle of findAvailableRooms(scheduleAll, heure2, capacite)) {
                if (salle !== ""){
                    console.log(couleurReponse("\t- "+salle));
                }        
            }
            break;
        case "5":
            console.log(couleurReponse(`Voici les salles triées en fonction de leur capacité`));
            for (let salle of geRoomsByCapcity(scheduleAll)) {
                    console.log(couleurReponse("\t- Salle : "+salle.room+" ; Capacité : "+salle.capacity));      
            }
            break;
        case "6":
            const [roomHoursOccupancy, percentageOccupancy] = getNumberOccupation(scheduleAll);
            console.log(couleurReponse("Taux d'occupation des salles :"));
            for (const [room, occupation] of Object.entries(roomHoursOccupancy)) {
                console.log(couleurReponse(`\t- ${room} : ${occupation} heures soit ${percentageOccupancy[room]}%`));
            }
            break
        case "7":
            let DateDebut = question(couleurQuestion("\tVeuilez indiquer la date de début YYMMDD (ex : 241223) : "));
            let DateFin = question(couleurQuestion("\tVeuilez indiquer la date de fin YYMMDD (ex : 241230) : "));
            let Courses = question(couleurQuestion("\tQuels cours voulez vous examiner ? (ex : AP03 MT01 GL02) : "));
            break;
        case "8":
            let salle3 = question(couleurQuestion("\tSalle (ex : P101): "));
            console.log(couleurReponse("La salle "+salle3+" a une capacité maximale de "+getRoomCapacity(scheduleAll, salle3)+" places."));
            break;
            
        case "9":
            console.log(couleurReponse("Au revoir !"));
            break;     
        }

    if (option.trim() != "9") {        
        let option2 = question(couleurQuestion("\n\nRetourner au menu principal ? (y/n) "));
        if (option2.trim().toLowerCase() === "y") {
            console.log("\n\n\n\n\n\n\n\n\n\n")
            MenuPrincipal();
        }
    }
}


//Choix du path du dossier data
//const folderPath = question("Veuillez entrer le chemin du dossier data : ");
//const scheduleAll = parseAllFiles(folderPath);

MenuPrincipal();

//test();