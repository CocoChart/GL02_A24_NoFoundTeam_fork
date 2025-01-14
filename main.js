// const { yellow, red, green } = require('colors');
const { parseFile } = require('./parser');
const fs  = require('fs');

// Fonction pour parser tous les fichiers d'un répertoire
function parseAllFiles(folderPath) {
    const allCourses = [];

    if (!fs.existsSync(folderPath)) {
        console.log(couleurRouge("Répertoire introuvable :" + folderPath));
    } else {
        const files = fs.readdirSync(folderPath);
        
        files.forEach(file => {
            const courses = parseFile(`./SujetA_data/${file}/edt.cru`);
            allCourses.push(...courses);
        
        });

    }

    return allCourses;
}



// SPEC 1 et 4 Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités

// [EVOL] - Améliorer le code compact J.BOYER

//Fonction permettant de vérifier si une salle est occupée à un créneau donné
// function isRoomOccupied(schedule, room, time) {
//     const courses = Object.values(schedule);
//     for (let course of courses) {
//         if (course.room === room && course.time === time) {
//             return true;
//         }
//     }
//     return false;
// }

// Fonction permettant d'avoir la capcité maximale d'une salle donnée
// function getRoomCapacity(schedule, room) {
//     const courses = Object.values(schedule); 
//     let maxCapacity = 0;
//     for (let course of courses) {
//         if (course.room === room && course.capacity > maxCapacity) {
//             maxCapacity = course.capacity;
//         }
//     }
//     return maxCapacity;
// }

//Fonction permettant de vérifier si une salle est occupée à un créneau donné
function isRoomOccupied(schedule, room, time) {
    const courses = Object.values(schedule);
    for (let course of courses) {
        if (course.room === room && course.time === time) {
            return true;
        }
    }
    return false;
}

//Fonction permettant d'avoir la capacité maximale d'une salle donnée
function getRoomCapacity(schedule, room) {
    return Math.max( 0, ...Object.values(schedule).filter(course => course.room === room).map(course => course.capacity) );
}


//Fonction permettant de trouver les salles disponibles ayant une capacité suffisante à un créneau donné
function findAvailableRooms(schedule, time, capacity) {
    const listRooms = [];
    const availableRooms = [];
    const courses = Object.values(schedule);

    //Récupère la liste des salles
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






// SPEC 2. Accèder aux créneaux disponibles d'une salle donnée avec la capacité max de la salle

//Fonction permettant de trouver les créneaux disponibles pour une salle donnée
// function findAvailableSlots(schedule, salle) {
//     const creneaux = [];
//     const courses = Object.values(schedule);

//     for (const course of courses) {
//         if (course.room === salle) {
//             creneaux.push(course.time);
//         }
//     }
//     return creneaux.sort(); 
// }


// Fix Bug ordre de tri par jour et par heure J- BOYER
//Fonction permettant de trouver les créneaux disponibles pour une salle donnée
function findAvailableSlots(schedule, salle) {
    const courses = Object.values(schedule);
    const creneaux = courses.filter(el=>el.room==salle).map(el=>el.time);

    const dayOfWeek = {
        D: 0,  // Dimanche
        L: 1,  // Lundi
        MA: 2, // Mardi
        ME: 3, // Mercredi
        J: 4,  // Jeudi
        V: 5,  // Vendredi
        S: 6   // Samedi
    };

    const creneauxTri = creneaux.sort((a, b) => {
            let dayA = a.split(" ")[0].trim();
            let creneauA = a.split(" ")[1].trim();
            let hourStartA = parseInt(creneauA.split("-")[0]);
            
            let dayB = b.split(" ")[0].trim();
            let creneauB = b.split(" ")[1].trim();
            let hourStartB = parseInt(creneauB.split("-")[0]);
        
            return (dayOfWeek[dayA] -  dayOfWeek[dayB]) || (hourStartA - hourStartB) ;
    });

          
    return creneauxTri; 
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

// SPEC 3 Rechercher les salles et les créneaux horaires d'un cours donné 

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
    });

    return result;
}







// SPEC 5. Classer les salles par capacité d'accueil max 

//Fonction pour classer les salles en fonction de leur capacité d'accueil
function geRoomsByCapcity(schedule) {
    const rooms = [];
    const roomsNames=[]; //Contient le nom des salles déja ajoutées au tableau rooms

    // Parcours de tous les cours dans le planning
    Object.values(schedule).forEach(course=> {
        //courseList.forEach(course => {

            //Si la salle n'a pas été traitées
            if (!roomsNames.includes(course.room)&&course.room!="") {
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







// SPEC 6. Visualiser le taux d'occupation des salles 

function getNumberOccupation(schedule) {
    const roomHoursOccupancy = {};  // Dictionary to store room ID and its occupation count
    const percentageOccupancy = {};  // Dictionary to store room ID and its occupation percentage
    const courses = Object.values(schedule);
    courses.sort((a, b) => a.room.localeCompare(b.room));
    
    for (const course of courses) {
        if (!course.room) continue;
        if (!roomHoursOccupancy[course.room]) {
            roomHoursOccupancy[course.room] = 0;        
        }
        roomHoursOccupancy[course.room]+=2;  // Increment the count for this room
    }
    for (const course of courses){
        if (!course.room) continue;
        percentageOccupancy[course.room] = (roomHoursOccupancy[course.room] / 60) * 100;
    }
    
    
    return [roomHoursOccupancy, percentageOccupancy];  // Return the dictionary with room IDs and their occupation counts
}








/**
 * SPEC 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 
 * 
 *
 * @param {string} dateDebut - La date de début
 * @param {string} dateFin - La date de fin
 * @param {array} courses - Liste des cours
 * @param {array} scheduleAll - calendrier
 * @returns {void}
 */
function generateICalendar(dateDebut, dateFin, courses, scheduleAll) {

    // **Fonction imbriquée (NESTED) interne
    // Ajoute chaque event créé dans createEventsForCourses dans icsContent
    function addEventToICS(event) {
        const eventContent = `
BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${event.dtstamp}
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.summary}
LOCATION:${event.location}
END:VEVENT
`.trim();
        // Ajouter l'événement au contenu iCalendar
        icsContent += eventContent + '\n\n'; // Ajoute un saut de ligne pour séparer les événements
    };

    // **Fonction imbriquée (NESTED) 
    // Crée et insère dans le calendrier des évenements chaque occurence du cours choisi par l'utilisateur
    function createEventsForCourses(schedule, course, period){
        // initialisation variables
        let event = [];
        let currentDate = new Date();
        let startDate = new Date();
        let endDate = new Date();
        const todayDate = new Date();

        // On détermine les horaires et les salles du cours en input
        let creneau = findCourseSchedule(schedule, course);

        /* Pour chaque créneau de cours, on cycle sur toute la longueur de la période du calendrier.
        Si le jour de la semaine incrémentale correspond au jour où se déroule le cours chaque semaine,
        on crée une structure event, contenant les information relatives à ce cours, en dates absolues 
        ex : Date du début de l'event = 20241205T170000Z 
                      Soit 20241205 pour le 05/12/2024
                      T pour le time ici 17:00:00
                      Z pour indique le fuseau horaire UTC
        On travaille en UTC, ça sera plus simple pour la portabilité du fichier.*/

        for (const i of creneau){
            // console.log("i =", i);
           const eventInfo = parseSchedule(i.time); 
           // On parse (regex) la string time d'un cours pour récupérer les infos dans une structure eventInfo
           let dayCode = period.dayIndex;

           // On cycle pour toute la longueur de la période spécifiée par l'utilisateur  
           for (let j = 0; j < period.differenceInDays; j++){
            currentDate = addDaysToUTCDate(period.dateStart, j); // On cycle la date en la mettant à jour avec dateDebut + j eme jour.
            // console.log("current date : ", currentDate);

            // Le daycode indique le jour de la semaine (dim = 0, lun = 1 etc), il change en même temps qu'on ajoute les jours ci-dessus.
            // Si on arrive à un jour de la semaine qui correspond à un jour de cours on crée un event avec la date et l'heure.
            if (dayCode == eventInfo.dayCode){
                startDate = setLocalTimeToUTCDate(currentDate, eventInfo.startTime);
                endDate = setLocalTimeToUTCDate(currentDate, eventInfo.endTime);
                
                let randomUid = '';
                for (let i = 0; i < 10; i++) {
                    randomUid += Math.floor(Math.random() * 10).toString();
                }

                event = {
                    uid     : randomUid,                                                          // Nom du cours, à modifier pour un uid random ?
                    dtstamp : todayDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
                    start   : startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",   //on formate la date pour ics
                    end     : endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
                    summary : course,                                                             // summary arbitraire à changer
                    location: i.room,                                                             // La salle de cours
                };
                
                // On ajoute l'event à icsContent qui servira à générer un fichier ics
                addEventToICS(event);
            }
            // On incrémente dayCode
            // if (dayCode == 6){
            //     dayCode = 0;
            // }
            // else {
            //     dayCode = dayCode + 1;
            // }

            // [EVOL] - Améliorer le code compact J.BOYER
            dayCode = (dayCode == 6) ? 0 : dayCode++; // jour de la semaine suivant
            
           }
        }
        
        // **Fonction imbriquée (NESTED) 
        // Formate les données de schedule du cours donné.
        function parseSchedule(courseTime) {
            // Regex pour extraire le jour et les heures de la string course.time
            const regex = /([LMAEJVSD])\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/;
            const match = courseTime.match(regex);
        
            if (!match) {
                throw new Error("Format de chaîne invalide");
            }
        
            const dayLetter = match[1]; // Lettre du jour
            const startTime = match[2]; // Heure de début
            const endTime = match[3]; // Heure de fin
        
            // Mapping des jours de la semaine (dimanche = 0)
            const daysMap = {
                D: 0, // Dimanche
                L: 1, // Lundi
                M: 2, // Mardi
                M: 3, // Mercredi
                J: 4, // Jeudi
                V: 5, // Vendredi
                S: 6  // Samedi
            };
        
            // Obtenir le jour codé
            const dayCode = daysMap[dayLetter];
      
            return {
                dayCode,
                startTime,
                endTime
            };
        }

    };

    // **Fonction imbriquée (NESTED)   
    //Trouver le jour de la semaine correspondant à la date et return une structure avec les infos importantes
    function getPeriod(dateStringStart, dateStringEnd) {
        // Créer un objet Date à partir de la chaîne de date
        const dateStart = new Date(dateStringStart);
        // Vérifier si la date est valide
        if (isNaN(dateStart)) {
            throw new Error("Erreur : Date de début invalide"); // Lancer une exception
        }
        const dateEnd = new Date(dateStringEnd);
        if (isNaN(dateEnd)) {
            throw new Error("Erreur : Date de fin invalide"); // Lancer une exception
        }
        
        ////// On vient compter le nombre de jours entre les deux dates
        const timestamp1 = dateStart.getTime();
        const timestamp2 = dateEnd.getTime();

        // On vérifie que timestamp1 < timestamp2
        if (timestamp2 < timestamp1) {
            throw new Error("Erreur : Date de début > date de fin"); // Lancer une exception
        }

        // Calculer la différence en millisecondes
        const differenceInMilliseconds = Math.abs(timestamp2 - timestamp1);

        // Convertir la différence en jours
        const millisecondsInADay = 1000 * 60 * 60 * 24; // 1000 ms * 60 s * 60 min * 24 h
        const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsInADay);


        // Obtenir le jour de la semaine (0 = dimanche, 1 = lundi, ..., 6 = samedi) 
        // Conditionne tout le reste de l'algo (comparaisons dans createEventsForCourses)
        const dayIndex = dateStart.getDay();

        // Tableau des jours de la semaine
        const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

        period = {
            dateStart,
            dateEnd,
            dayIndex,
            weekDayStart : daysOfWeek[dayIndex],
            differenceInDays
        }

        // Retourner le jour de la semaine
        return period;
    };

    // **Fonction imbriquée (NESTED) 
    // Sert à extraire les cours d'une string en contenant plusieurs
    function extractCourses(input) {
        // Supprimer les espaces supplémentaires et diviser la chaîne par des espaces, des virgules ou des points-virgules
        const codes = input.trim().split(/[\s,;]+/);

        // Utiliser un Set pour éliminer les doublons
        const codesUniques = new Set(codes);

        // Vérifier s'il y a des doublons
        if (codes.length !== codesUniques.size) {
            console.warn("Attention : des codes en double ont été trouvés !");
        }

        // Retourner un tableau des codes uniques
        return Array.from(codesUniques);
    }


    ///////////// Début de la fonction generateICalendar() ////////////////////

    // Variable pour stocker le contenu iCalendar
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN

`;
    // On détermine la période demandée par l'utilisateur
    let period = getPeriod(dateDebut, dateFin);
    // On extrait les cours indiqués par l'utilisateur
    coursesStruct = extractCourses(courses);

    // Pour chaque cours on lance la génération des différent event dans la période donnée
    for (let course of coursesStruct){
        createEventsForCourses(scheduleAll, course, period);
    };

    icsContent += `END:VCALENDAR`; //Finalisation du vcalendar

//     console.log(`ICS CONTENT : 
// ${icsContent}`);

    const fileName = dateDebut + " " + dateFin + " " + courses + ".ics" ;
    // On sauvegarde le fichier au format ICS
    saveICSFile(icsContent, fileName);
}



/**
 * Ajoute un horaire (dans le fuseau horaire local) à une date et convertie le tout en format UTC 
 * en fonction de la localisation de l'utilisateur.
 *
 * @param {string} dateUTC - La date d'origine en UTC (ISO 8601).
 * @param {string} localTime - L'heure à appliquer (format "HH:mm" en heure locale).
 * @returns {Date} - La nouvelle date en UTC sous forme d'objet Date.
 */
function setLocalTimeToUTCDate(dateUTC, localTime) {
    const [hours, minutes] = localTime.split(':').map(Number); // Extraire heures et minutes
    const date = new Date(dateUTC); // Créer un objet Date à partir de la date UTC

    // Obtenir le décalage local en minutes (positif à l'ouest, négatif à l'est de UTC)
    const timezoneOffsetMinutes = date.getTimezoneOffset();

    // Calcul de l'heure en UTC
    const utcHours = hours - timezoneOffsetMinutes / 60;
    const utcMinutes = minutes - (timezoneOffsetMinutes % 60);

    // Appliquer l'heure UTC à la date
    date.setUTCHours(utcHours, utcMinutes, 0, 0); // Pas de secondes ni millisecondes

    // Retourner l'objet Date modifié
    return date;
};


/**
 * Ajoute un nombre de jours à une date UTC.
 *
 * @param {string} dateUTC - La date d'origine en UTC (ISO 8601).
 * @param {number} daysToAdd - Le nombre de jours à ajouter (peut être négatif).
 * @returns {string} - La nouvelle date en UTC au format ISO 8601.
 */
function addDaysToUTCDate(dateUTC, daysToAdd) {
    const date = new Date(dateUTC); // Convertir la chaîne UTC en objet Date

    // Ajouter les jours en millisecondes
    date.setUTCDate(date.getUTCDate() + daysToAdd);

    // Retourner la date au format ISO 8601
    return date;
};

// Fonction pour sauvegarder un fichier .ics à partir d'un contenu donné
function saveICSFile(icsContent, filename = 'test.ics') {
    // Crée un fichier avec le contenu ICS dans le répertoire courant
    fs.writeFileSync(filename, icsContent, 'utf8');
    console.log(`Fichier ${filename} sauvegardé !`);
}

//////////Fin fonction 7//////////

// Vérification des conflits

//Fonction permettant de vérifier les conflits de salle (si il y a plusieurs cours dans la même salle au même créneau)
function verifyConflicts(schedule) {
    const listTimeRoom = {};
    const conflicts = {}; 
    const courses = Object.values(schedule);

    for (const course of courses) {
        if (course.room === "EXT1") {
            continue; // Ignorer les cours avec la salle EXT1
        }

        const timeRoom = `${course.room}-${course.time}`;

        if (!listTimeRoom[timeRoom]) {
            listTimeRoom[timeRoom] = [];
        }

        listTimeRoom[timeRoom].push(course.courseId);

        if (listTimeRoom[timeRoom].length > 1) {
            conflicts[timeRoom] = listTimeRoom[timeRoom]; 
        }
    }

    return conflicts;
}


//Fonction permettant d'écrire un rapport de conflits dans un fichier txt
function writeConflicts(conflicts) {
    
    const sortedConflicts = Object.keys(conflicts).sort();
    let content = "Rapport de conflits\n\n";
    for (const timeRoom of sortedConflicts) {
        content += `${timeRoom} : ${conflicts[timeRoom].join(', ')}\n`;
    }

    fs.writeFileSync('conflicts.txt', content);
}



//------FONCTIONS DE TESTS------

// **REFACTORING #1 (début) J.BOYER
// Fonction générique pour vérifier si une propriété existe dans l'emploi du temps
function existsInSchedule(schedule, property, value) {
    return Object.values(schedule).some(course => course[property] === value);
}

// //Fonction permettant de vérifier qu'une salle existe 
// function roomExistes(schedule, room) {
//     const courses = Object.values(schedule);
//     for (const course of courses) {
//         if (course.room === room) {
//             return true;
//         }
//     }
//     return false;
// }
//
// //Fonction permettant de vérifier qu'un créneau horaire existe
// function slotExistes(schedule, slot) {
//     const courses = Object.values(schedule);
//     for (const course of courses) {
//         if (course.time === slot) {
//             return true;
//         }
//     }
//     return false;
// }
// 
//Fonction permettant de vérifier qu'un cours existe
// function courseExistes(schedule, course) {
//     const courses = Object.values(schedule);
//     for (const c of courses) {
//         if (c.courseId === course) {
//             return true;
//         }
//     }
//     return false;
// }
// 
// **REFACTORING #1 (fin) J.BOYER


const question = require('prompt-sync')({sigint: true});
const chalk = require('chalk');//Permet de gerer les couleurs du texte
const { exit } = require('process');
const { verify } = require('crypto');

const couleurTitre= chalk.hex('#BCA12D');
const couleurTexteMenu= chalk.hex('#edfbc1');
const couleurQuestion= chalk.hex('#858031');
const couleurReponse= chalk.hex('#d9d375');
const couleurRouge= chalk.hex('#ff0000');
const couleurVert= chalk.hex('#00ff00');


const questionClr = (str) => question(couleurQuestion(str));



//Fonction permettant d'afficher et utiliser le menu principal
function MenuPrincipal(scheduleAll) {
    
    

    console.log(couleurTitre("\n╔═══════════════════════════════════════════════════════════════════════════════╗"));
    console.log(couleurTitre("║                                MENU PRINCIPAL                                 ║"));
    console.log(couleurTitre("╠═══════════════════════════════════════════════════════════════════════════════╣"));
    console.log(couleurTexteMenu("║      [1] Afficher les créneaux disponibles d'une salle donnée                 ║"));
    console.log(couleurTexteMenu("║      [2] Afficher si une salle est occupée à un créneau donné                 ║"));
    console.log(couleurTexteMenu("║      [3] Afficher les salles et créneaux horaires d'un cours donné            ║"));
    console.log(couleurTexteMenu("║      [4] Afficher les salles disponibles à un créneau et une capacité donnés  ║"));
    console.log(couleurTexteMenu("║      [5] Afficher les salles triées par capacité                              ║"));
    console.log(couleurTexteMenu("║      [6] Visualiser le taux d'occupation des salles                           ║"));
    console.log(couleurTexteMenu("║      [7] Générer un fichier iCalendar                                         ║"));
    console.log(couleurTexteMenu("║      [8] Afficher la capacité maximale d'une salle donnée                     ║"));
    console.log(couleurTexteMenu("║      [9] Afficher le rapport de conflits                                      ║"));
    console.log(couleurTexteMenu("║                                                                               ║"));
    console.log(couleurTexteMenu("║      [0] Quitter                                                              ║"));
    console.log(couleurTitre("╚═══════════════════════════════════════════════════════════════════════════════╝"));


    let option = question(couleurQuestion("Choisissez une option: "));
    switch (option.trim()) {
        default:
            console.log(couleurRouge("Veuillez choisir une option valide"));
            break;

        case "1":
            let salle1 = questionClr("\tSalle (ex : P101): ");
            while (!existsInSchedule(scheduleAll, "room", salle1)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle1 = questionClr("\tSalle (ex : P101): ");
            }
            let capacity = getRoomCapacity(scheduleAll, salle1);
            console.log(couleurReponse("La salle "+salle1+" ("+ capacity.toString() +" places) est disponible aux créneaux:"));
            for (let crenau of findAvailableSlots(scheduleAll, salle1)) {
                console.log(couleurReponse("\t- "+crenau));
            }
            break;
        case "2":
            let salle2 = questionClr("\tSalle (ex : P101): ");
            while (!existsInSchedule(scheduleAll, "room", salle2)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle2 = questionClr("\tSalle (ex : P101): ");
            }
            let heure = questionClr("\tHoraire (ex : ME 10:00-12:00) : ");
            while (!existsInSchedule(scheduleAll, "time", heure)) {
                console.log(couleurRouge("L'horaire n'existe pas"));
                heure = questionClr("\tHoraire (ex : ME 10:00-12:00) : ");
            }
                if (isRoomOccupied(scheduleAll, salle2, heure)) {
                    console.log(couleurRouge(`La salle ${salle2} est occupée à ${heure}`+" par le cours "+getCoursesByRoomAndSlot(scheduleAll, salle2, heure)));
                } else {
                    console.log(couleurVert(`La salle ${salle2} est libre à ${heure}`));
                }
            
            break;
        case "3":
            let cours = questionClr("\tNom du cours (ex : AP03): ");
            while (!existsInSchedule(scheduleAll, "courseId", cours)) {
                console.log(couleurRouge("Le cours n'existe pas"));
                cours = questionClr("\tNom du cours (ex : AP03): ");
            }
            console.log(couleurReponse(`Voici les créneaux et salles de cours de l'UE ${cours}`));
            for (let creneau of findCourseSchedule(scheduleAll, cours)) {
                console.log(couleurReponse(`\t- Créneaux : ${creneau.time} ; Salle : ${creneau.room}`));
            }
            break; 
        case "4":
            let heure2 = questionClr("\tHoraire (ex : ME 10:00-12:00) : ");
            while (!existsInSchedule(scheduleAll, "time", heure2)) {
                console.log(couleurRouge("L'horaire n'existe pas"));
                heure2 = questionClr("\tHoraire (ex : ME 10:00-12:00) : ");
            }
            let capacite = questionClr("\tCapacité : ");
            while (capacite < 0) {
                console.log(couleurRouge("La capacité doit être un nombre positif"));
                capacite = questionClr("\tCapacité : ");
            }
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
                let percent = percentageOccupancy[room].toFixed(2);
                console.log(couleurReponse(`\t- ${room} : ${occupation} heures soit ${percent}%`));
            }
            break
        case "7":
            let dateDebut = questionClr("\tVeuilez indiquer la date de début YYYY-MM-DD (ex : 2024-12-23) : ");
            let dateFin = questionClr("\tVeuilez indiquer la date de fin YYYY-MM-DD (ex : 2024-12-30) : ");
            let courses = questionClr("\tQuels cours voulez vous examiner ? (ex : AP03 MT01 GL02) : ");
            generateICalendar(dateDebut, dateFin, courses, scheduleAll);
            break;
        case "8":
            let salle3 = questionClr("\tSalle (ex : P101): ");
            while (!existsInSchedule(scheduleAll, "room", salle3)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle3 = questionClr("\tSalle (ex : P101): ");
            }
            console.log(couleurReponse("La salle "+salle3+" a une capacité maximale de "+getRoomCapacity(scheduleAll, salle3)+" places."));
            break;
        case "9":
            console.log(couleurReponse("Voici le rapport de conflits :"));
            console.log(fs.readFileSync('conflicts.txt', 'utf8'));
            break;
            
        case "0":
            console.log(couleurReponse("Au revoir !"));
            break;     
        }

    if (option.trim() != "0") {  
        let option2 = questionClr("\n\nRetourner au menu principal ? (y/n) ");
        while (option2 != "y" && option2 != "n") {     
            console.log(couleurRouge("Veuillez choisir une option valide"));  
            option2 = questionClr("\n\nRetourner au menu principal ? (y/n) ");
        }
        if (option2.trim().toLowerCase() === "y") {
            console.log("\n\n\n\n\n\n\n\n\n\n")
            MenuPrincipal(scheduleAll);
        }
    }
}

//Fonction vérifiant si le path rentré contient des fichiers crus 
function verifyPathContainsCruFiles(path) {	
	let containsCru = false;
	let containsOnlyCru = true;

    if (!fs.existsSync(path)) {
        return [false, false];
    }  else {
        var files = fs.readdirSync(path);//On récupère la liste des fichiers dans le dossier
        for (var i=0; i<files.length; i++){ //Pour chaque fichier
            var filePath = path + '/' + files[i]; //On crée le chemin d'accès au fichier
            var extension = files[i].split('.'); //la dernière partie de 'extension' est l'extension
            if (fs.lstatSync(filePath).isDirectory()){ //Si c'est un dossier
                [containsCru,containsOnlyCru] = verifyPathContainsCruFiles(filePath); //On vérifie si le dossier contient des fichiers crus
            } else if (extension[(extension.length)-1]=='cru'){ //Si l'extension est 'cru'
                containsCru = true; //On met containsCru à true
            } else if (extension[(extension.length)-1]!='cru'){ //Si l'extension n'est pas 'cru'
                containsOnlyCru = false; //On met containsOnlyCru à false
            }
            return [containsCru,containsOnlyCru];
        }
    }
    

   
}

//Fonction d'accueil (appelée au début avant le Menu principal)
function welcome() {
    console.log(couleurTitre("\n Welcome ! "));

    let choix = questionClr("Voulez-vous analyser un fichier ou un dossier ? (fichier/dossier) : ").toLowerCase();
    while (choix !== "fichier" && choix !== "dossier") {
        console.log(couleurRouge("Veuillez choisir une option valide : fichier ou dossier."));
        choix = questionClr("Voulez-vous analyser un fichier ou un dossier ? (fichier/dossier) : ").toLowerCase();
    }

    if (choix === "dossier") {
        let path = questionClr("Entrez le chemin d'accès du dossier contenant les fichiers .cru : ");
        if (!verifyPathContainsCruFiles(path)[0]) {
            console.log(couleurRouge("Le dossier ne contient pas de fichiers .cru valides."));
            return welcome();
        }
        const scheduleAll = parseAllFiles(path);
        processSchedule(scheduleAll);
    } else if (choix === "fichier") {
        let filePath = questionClr("Entrez le chemin d'accès du fichier .cru : ");
        if (!fs.existsSync(filePath) || !filePath.endsWith(".cru")) {
            console.log(couleurRouge("Le fichier spécifié n'est pas valide ou n'existe pas."));
            return welcome();
        }
        const scheduleAll = parseFile(filePath);
        processSchedule(scheduleAll);
    }
}

function processSchedule(scheduleAll) {
    const conflicts = verifyConflicts(scheduleAll);
    writeConflicts(conflicts);

    console.log(couleurReponse("Le rapport de conflits a été généré."));
    let choix = questionClr("Voulez-vous afficher le rapport de conflits ? (y/n) : ").toLowerCase();
    while (choix !== "y" && choix !== "n") {
        console.log(couleurRouge("Veuillez choisir une option valide."));
        choix = questionClr("Voulez-vous afficher le rapport de conflits ? (y/n) : ").toLowerCase();
    }

    if (choix === "y") {
        console.log(couleurReponse("Voici le rapport de conflits :"));
        console.log(fs.readFileSync('conflicts.txt', 'utf8'));
    }

    choix = questionClr("Souhaitez-vous aller au Menu Principal ? (y/n) : ").toLowerCase();
    while (choix !== "y" && choix !== "n") {
        console.log(couleurRouge("Veuillez choisir une option valide."));
        choix = questionClr("Souhaitez-vous aller au Menu Principal ? (y/n) : ").toLowerCase();
    }

    if (choix === "y") {
        MenuPrincipal(scheduleAll);
    } else {
        console.log(couleurReponse("Au revoir !"));
        exit();
    }
}



//MenuPrincipal();
if (require.main === module) {
    welcome();
  }




  module.exports = {
    isRoomOccupied,
    findAvailableRooms,
    getRoomCapacity,
    findAvailableSlots,
    findCourseSchedule, 
    geRoomsByCapcity,
    getNumberOccupation,
    findCourseSchedule,
    generateICalendar,
    verifyConflicts,
    writeConflicts,
    // REFACTORING #1 (debut) J.BOYER
    existsInSchedule,
    // roomExistes,   
    // slotExistes,
    // courseExistes, 
    // REFACTORING #1 (fin) J.BOYER
    parseFile,
  };