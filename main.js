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



// SPEC 1 et 4 Vérifier l'occupation d'une salle et  Trouver les salles disponibles pour un créneau donné avec les capacités

//fonction qui permet de vérifier si une salle est occupée à un créneau donné
function isRoomOccupied(schedule, room, time) {
    const courses = Object.values(schedule);
    for (let course of courses) {
        if (course.room === room && course.time === time) {
            return true;
        }
    }
    return false;
}

// fonction qui permet d'avoir la capcité maximale d'une salle donnée
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

//fonction qui permet de trouver les salles disponibles ayant une capacité suffisante à un créneau donné
function findAvailableRooms(schedule, time, capacity) {
    const listRooms = [];
    const availableRooms = [];
    const courses = Object.values(schedule);

    //récupère la liste des salles
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

//fonction qui permet de trouver les créneaux disponibles pour une salle donnée
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

//Fonction qui classe les salles en fonction de leur capacité d'accueil
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







// SPEC 7. Générer un fichier iCalendar entre deux dates données pour des cours sélectionnés 
function generateICalendar(dateDebut, dateFin,courses, scheduleAll) {

    // Fonction interne, ajoute chaque event crée dans createEventsForCourses dans icsContent
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

    // On vient créer et insérer dans le calendrier des évenements à chaque occurence du cours 
    // choisi par l'utilisateur
    function createEventsForCourses(schedule, course, period){
        // initialisation variables
        let event = [];
        let currentDate = new Date();
        let startDate = new Date();
        let endDate = new Date();
        const todayDate = new Date();

        // On détermine les horaires et les salles du cours en input
        let creneau = findCourseSchedule(schedule, course);

        // pour chaque créneau de cours, on cycle sur toute la longueur de la période du calendrier.
        // Si le jour de la semaine incrémentale matche le jour ou se déroule le cours chaque semaine,
        // on crée une structure event, contenant les information relatives à ce cours, en dates absolues 
        // ex : Date du début de l'event = 20241205T170000Z 
        //              Soit 20241205 pour le 05/12/2024
        //              T pour le time ici 17:00:00
        //              Z pour indique le fuseau horaire UTC
        // On travaille en UTC, ça sera plus simple pour la portabilité du fichier.

        for (const i of creneau){
            // console.log("i =", i);
           const eventInfo = parseSchedule(i.time); 
           // On parse (regex) la string time d'un cours pour récupérer les infos dans une structure eventInfo
           let dayCode = period.dayIndex;

           // pour toute la longueur de la période spécifiée par l'utilisateur on cycle
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
                    uid: randomUid, // Nom du cours, à modifier pour un uid random ?
                    dtstamp: todayDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
                    start: startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z", //on formatte la date pour ics
                    end: endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
                    summary: course, // summary arbitraire à changer
                    location: i.room, // La salle de cours
                };
                
                // On ajoute l'event à icsContent qui servira à générer un fichier ics
                addEventToICS(event);
            }
            // On incrémente dayCode
            if (dayCode == 6){
                dayCode = 0;
            }
            else {
                dayCode = dayCode + 1;
            }
            
           }
        }
        
        // Formatte les données de schedule du cours donné.
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

    icsContent += `END:VCALENDAR`; //finalisation du vcalendar

//     console.log(`ICS CONTENT : 
// ${icsContent}`);

    const fileName = dateDebut + " " + dateFin + " " + courses + ".ics" ;
    // On sauvegarde le fichier au format ICS
    saveICSFile(icsContent, fileName);
}

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
    // conditionnne tout le reste de l'algo (comparaisons dans createEventsForCourses)
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
    // return date.toISOString();
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

//fonction qui permet de vérifier les conflits de salle (si il y a plusieurs cours dans la même salle au même créneau)
function verifyConflicts(schedule) {
    const listTimeRoom = {};
    const conflicts = {}; 
    const courses = Object.values(schedule);
    
    for (const course of courses) {
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

//fonction qui permet d'écrire un rapport de conflits dans un fichier txt
function writeConflicts(conflicts) {
    
    const sortedConflicts = Object.keys(conflicts).sort();
    let content = "Rapport de conflits\n\n";
    for (const timeRoom of sortedConflicts) {
        content += `${timeRoom} : ${conflicts[timeRoom].join(', ')}\n`;
    }

    fs.writeFileSync('conflicts.txt', content);
}



//fonctions de test 

//fonction qui permet de vérifier qu'une salle existe 
 function roomExistes(schedule, room) {
    const courses = Object.values(schedule);
    for (const course of courses) {
        if (course.room === room) {
            return true;
        }
    }
    return false;
}

//fonction qui permet de vérifier qu'un créneau horaire existe
function slotExistes(schedule, slot) {
    const courses = Object.values(schedule);
    for (const course of courses) {
        if (course.time === slot) {
            return true;
        }
    }
    return false;
}

//fonction qui permet de vérifier qu'un cours existe
function courseExistes(schedule, course) {
    const courses = Object.values(schedule);
    for (const c of courses) {
        if (c.courseId === course) {
            return true;
        }
    }
    return false;
}




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


//fonction qui permet d'afficher le menu principal
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
            let salle1 = question(couleurQuestion("\tSalle (ex : P101): "));
            while (!roomExistes(scheduleAll, salle1)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle1 = question(couleurQuestion("\tSalle (ex : P101): "));
            }
            let capacity = getRoomCapacity(scheduleAll, salle1);
            console.log(couleurReponse("La salle "+salle1+" ("+ capacity.toString() +" places) est disponible aux créneaux:"));
            for (let crenau of findAvailableSlots(scheduleAll, salle1)) {
                console.log(couleurReponse("\t- "+crenau));
            }
            break;
        case "2":
            let salle2 = question(couleurQuestion("\tSalle (ex : P101): "));
            while (!roomExistes(scheduleAll, salle2)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle2 = question(couleurQuestion("\tSalle (ex : P101): "));
            }
            let heure = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
            while (!slotExistes(scheduleAll, heure)) {
                console.log(couleurRouge("L'horaire n'existe pas"));
                heure = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
            }
                if (isRoomOccupied(scheduleAll, salle2, heure)) {
                    console.log(couleurRouge(`La salle ${salle2} est occupée à ${heure}`+" par le cours "+getCoursesByRoomAndSlot(scheduleAll, salle2, heure)));
                } else {
                    console.log(couleurVert(`La salle ${salle2} est libre à ${heure}`));
                }
            
            break;
        case "3":
            let cours = question(couleurQuestion("\tNom du cours (ex : AP03): "));
            while (!courseExistes(scheduleAll, cours)) {
                console.log(couleurRouge("Le cours n'existe pas"));
                cours = question(couleurQuestion("\tNom du cours (ex : AP03): "));
            }
            console.log(couleurReponse(`Voici les créneaux et salles de cours de l'UE ${cours}`));
            for (let creneau of findCourseSchedule(scheduleAll, cours)) {
                console.log(couleurReponse(`\t- Créneaux : ${creneau.time} ; Salle : ${creneau.room}`));
            }
            break; 
        case "4":
            let heure2 = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
            while (!slotExistes(scheduleAll, heure2)) {
                console.log(couleurRouge("L'horaire n'existe pas"));
                heure2 = question(couleurQuestion("\tHoraire (ex : ME 10:00-12:00) : "));
            }
            let capacite = question(couleurQuestion("\tCapacité : "));
            while (capacite < 0) {
                console.log(couleurRouge("La capacité doit être un nombre positif"));
                capacite = question(couleurQuestion("\tCapacité : "));
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
                console.log(couleurReponse(`\t- ${room} : ${occupation} heures soit ${percentageOccupancy[room]}%`));
            }
            break
        case "7":
            let dateDebut = question(couleurQuestion("\tVeuilez indiquer la date de début YYYY-MM-DD (ex : 2024-12-23) : "));
            let dateFin = question(couleurQuestion("\tVeuilez indiquer la date de fin YYYY-MM-DD (ex : 2024-12-30) : "));
            let courses = question(couleurQuestion("\tQuels cours voulez vous examiner ? (ex : AP03 MT01 GL02) : "));
            generateICalendar(dateDebut, dateFin, courses, scheduleAll);
            break;
        case "8":
            let salle3 = question(couleurQuestion("\tSalle (ex : P101): "));
            while (!roomExistes(scheduleAll, salle3)) {
                console.log(couleurRouge("La salle n'existe pas"));
                salle3 = question(couleurQuestion("\tSalle (ex : P101): "));
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
        let option2 = question(couleurQuestion("\n\nRetourner au menu principal ? (y/n) "));
        while (option2 != "y" && option2 != "n") {     
            console.log(couleurRouge("Veuillez choisir une option valide"));  
            option2 = question(couleurQuestion("\n\nRetourner au menu principal ? (y/n) "));
        }
        if (option2.trim().toLowerCase() === "y") {
            console.log("\n\n\n\n\n\n\n\n\n\n")
            MenuPrincipal(scheduleAll);
        }
    }
}

//Fonction qui verifie si le path rentré contient des fichiers crus 
function verifyPathContainsCruFiles(path) {	
	let containsCru = false;
	let containsOnlyCru = true;
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

//fonction d'accueil (appelée au début avant le Menu principal)
function welcome() {
    console.log(couleurTitre("\n Welcome ! "));
    
    let path = question(couleurQuestion("Entrez le chemin d'accès du dossier Data contenant les fichiers .cru :"));
    const scheduleAll = parseAllFiles(path);
    if (verifyPathContainsCruFiles(path)[0] == false) {
        console.log(couleurRouge("Le dossier ne contient pas de fichiers .cru"));
        welcome();
    } else if (verifyPathContainsCruFiles(path)[1] == false) {
        console.log(couleurRouge("Le dossier contient des fichiers autres que .cru"));
        welcome();
    } else {

    //console.log(scheduleAll);
    conflicts = verifyConflicts(scheduleAll);
    //create file txt with conflicts 
    writeConflicts(conflicts);
    console.log(couleurReponse("Le rapport de conflits a été généré"));
    console.log('Voulez vous afficher le rapport de conflits ? (y/n)');
    let choix = question(couleurQuestion(''));
    while (choix != "y" && choix != "n") {
        console.log(couleurRouge("Veuillez choisir une option valide"));
        choix = question(couleurQuestion(''));
    }
    if (choix === "y") {
        console.log(couleurReponse("Voici le rapport de conflits :"));
        console.log(fs.readFileSync('conflicts.txt', 'utf8'));
        console.log("Souhaitez-vous aller au Menu Principal ? (y/n)");
        let choix2 = question(couleurQuestion(''));
        while (choix2 != "y" && choix2 != "n") {
            console.log(couleurRouge("Veuillez choisir une option valide"));
            choix2 = question(couleurQuestion(''));
        }
        if (choix2 === "y") {
            MenuPrincipal(scheduleAll);
        }
        else {
            console.log(couleurReponse("Au revoir !"));
            exit();
        }
    }
    else {
        MenuPrincipal(scheduleAll);
    }
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
    roomExistes,
    slotExistes,
    courseExistes,
    parseFile,
  };