const fs = require('fs');
const {isRoomOccupied, getRoomCapacity, findAvailableRooms, findAvailableSlots, geRoomsByCapcity, getNumberOccupation, findCourseSchedule, generateICalendar, verifyConflicts, writeConflicts, roomExistes, slotExistes, courseExistes, parseFile} = require('../main.js');

// Test cases

describe ("Scenarios de tests du projet de gestion d'emploi du temps: \n", () => {
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

    describe ("SPEC 1 - Afficher les salles dispo sur un créneau avec capacité " , () => {
        it ('doit retourner vrai si la salle est occupée', () => {
            expect(isRoomOccupied(sampleSchedule, 'B103', 'V 13:00-16:00')).toBe(true);
        }); 
        it ('soit retourner faux si la salle est libre', () => {
            expect(isRoomOccupied(sampleSchedule, 'B103', 'V 16:00-19:00')).toBe(false);
        }); 
        it ('doit retourner faux si la salle n\'existe pas', () => {
            expect(isRoomOccupied(sampleSchedule, 'B104', 'V 16:00-19:00')).toBe(false);
        }); 
        it ('Doit renvoyer les salles disponibles', () => {
            expect(findAvailableRooms(sampleSchedule, 'V 13:00-16:00', 25)).toEqual(['P101']);
        }); 
        it ('Doit renvoyer les salles disponibles qui respectent la capacité', () => {
            expect(findAvailableRooms(sampleSchedule, 'L 10:00-12:00', 30)).toEqual(['P101']);
        }); 
       

    });

    describe ("SPEC 2 - accèder aux créneaux d'une salle" , () => {
        it ('doit renvoyer les créneaux ou la salle est libre', () => {
            expect(findAvailableSlots(sampleSchedule, 'P101')).toEqual(['ME 8:00-10:00', 'J 10:00-12:00'].sort());
        }); 
        it ('doit renvoyer une liste vide si la salle n\'existe pas', () => {
            expect(findAvailableSlots(sampleSchedule, 'P102')).toEqual([]);
        });
    
    });

    describe ("SPEC 3 - accèder aux salles et créneaux horaires d'un cours " , () => {
        it ('doit renvoyer les cours et les plages horaires d\'un cours', () => {
            expect(findCourseSchedule(sampleSchedule, 'AP03')).toEqual([{room: 'B103', time: 'V 13:00-16:00'}]);
        }); 
        it ('doit renvoyer une liste vide si le cours n\'existe pas', () => {
            expect(findCourseSchedule(sampleSchedule, 'RE10')).toEqual([]);
        }); 
    
    });

    describe ("SPEC 4 - accèder à la capacité d'une salle" , () => {
        it ('doit renvoyer la capacité de la salle ', () => {
            expect(getRoomCapacity(sampleSchedule, 'P101')).toEqual(30);
        }); 
        it ('doit renvoyer si la salle n\existe pas', () => {
            expect(getRoomCapacity(sampleSchedule, 'P102')).toEqual(0);
        }); 
    
    });

    describe ("SPEC 5 - accèder aux salles par capacité" , () => {
        const sample2 = {}; 
        it ('doit renvoyer la liste ordonnée des salles par capacité', () => {
            expect(geRoomsByCapcity(sampleSchedule)).toEqual([{ room: 'P101', capacity: 30 },{ room: 'B103', capacity: 24 } ]);
        });
        it ('doit renvoyer une liste vide si aucune salle n\'existe', () => {
            expect(geRoomsByCapcity(sample2)).toEqual([]);
        });
    }); 

    describe ("SPEC 6 - visualiser le taux d'occupation" , () => {
        const sample2 = {}; 
        it ('doit renvoyer le taux d\'occupation de chaque salle', () => {
            expect(getNumberOccupation(sampleSchedule)).toEqual([{ B103: 2, P101: 4 }, { B103: 3.3333333333333335, P101: 6.666666666666667}]);
        }); 
        it ('doit renvoyer une liste vide si aucune salle n\'existe', () => {
            expect(geRoomsByCapcity(sample2)).toEqual([]);
        });

    });

    describe ("SPEC 7 - générer un emploi du temps Icalendar" , () => {
        const dateDebut = "2024-12-01";
        const dateFin = "2024-12-07";
        const courses = "CL10 AP03";
        
        it ('doit créer le fichier Icalendar', () => {
            generateICalendar(dateDebut, dateFin, courses, sampleSchedule);
            expect(fs.existsSync(dateDebut + " " + dateFin + " " + courses + ".ics")).toBe(true);
        });

        it ('le fichier doit contenir les cours', () => {
            const fileContent = fs.readFileSync(dateDebut + " " + dateFin + " " + courses + ".ics", 'utf8');
            expect(fileContent).toContain('BEGIN:VCALENDAR');
            expect(fileContent).toContain('BEGIN:VEVENT');
            expect(fileContent).toContain('END:VCALENDAR');
            expect(fileContent).toContain('SUMMARY:AP03');
            expect(fileContent).toContain('SUMMARY:CL10');
        }); 
        
        it("doit renvoyer une erreur si la date de début est nulle", function() {
            const invalidDate = "";
            expect(function() { generateICalendar(invalidDate, "2024-12-07", "AP03", sampleSchedule); }).toThrowError("Erreur : Date de début invalide");
        });

        it ("doit créer plusieurs évènements si le cours a plusieurs créneaux ", () => {
            const sampleSchedule = [{
                courseId: 'AP03',
                index: 1,
                type: 'D2',
                capacity: 24,
                time: 'V 13:00-16:00',
                group: 'F1',
                room: 'B103'
              },
              {
                courseId: 'AP03',
                index: 1,
                type: 'D2',
                capacity: 24,
                time: 'J 13:00-16:00',
                group: 'F1',
                room: 'B103'
              }];
            generateICalendar(dateDebut, dateFin, "AP03", sampleSchedule);
            const fileContent = fs.readFileSync(dateDebut + " " + dateFin + " " + "AP03" + ".ics", 'utf8');
            
            expect(fileContent.match(/SUMMARY:AP03/g).length).toEqual(2);
        }); 
        
    });

    describe ("Vérification des conflits", () => {
        sample=[{
            courseId: 'AP03',
            index: 1,
            type: 'D2',
            capacity: 24,
            time: 'V 13:00-16:00',
            group: 'F1',
            room: 'B103'
          },
          {
            courseId: 'SY01',
            index: 1,
            type: 'D2',
            capacity: 24,
            time: 'V 13:00-16:00',
            group: 'F1',
            room: 'B103'
          }];

        it ('doit renvoyer une liste avec les conflits',() =>{
            expect(verifyConflicts(sample)).toEqual({"B103-V 13:00-16:00": [ 'AP03', 'SY01' ] }); 
        }); 
        
        it ('doit renvoyer une liste vide si aucun conflit',() =>{
            expect(verifyConflicts(sampleSchedule)).toEqual({});
        });

        it ('doit créer un fichier txt avec les conflits',() =>{
            writeConflicts(verifyConflicts(sample), "conflits");
            expect(fs.existsSync("conflicts.txt")).toBe(true);
        }); 

        it ('doit écrire les conflits dans le fichier txt', () =>{
            const fileContent = fs.readFileSync("conflicts.txt", 'utf8');
            expect(fileContent).toContain('AP03');
            expect(fileContent).toContain('SY01');
        }); 

    }); 

    describe ("Vérification de l'existence des données ", () => {
        it ('doit renvoyer vrai si la salle existe',() =>{
            expect(roomExistes(sampleSchedule, 'B103')).toBe(true);
        }); 
        it ('doit renvoyer faux si la salle n\'existe pas',() =>{
            expect(roomExistes(sampleSchedule, 'B104')).toBe(false);
        }); 
        it ('doit renvoyer vrai si le créneau existe',() =>{
            expect(slotExistes(sampleSchedule, 'V 13:00-16:00')).toBe(true);
        }); 
        it ('doit renvoyer faux si le créneau n\'existe pas',() =>{
            expect(slotExistes(sampleSchedule, 'V 16:00-19:00')).toBe(false);
        }); 
        it ('doit renvoyer vrai si le cours existe',() =>{
            expect(courseExistes(sampleSchedule, 'AP03')).toBe(true);
        });
        it ('doit renvoyer faux si le cours n\'existe pas',() =>{
            expect(courseExistes(sampleSchedule, 'RE10')).toBe(false);
        });
    }); 

    describe ("Parsing du fichier", () => {
        it ('doit renvoyer une liste de cours',() =>{
            const sampleFile = 'sample.cru';
            expect(parseFile(sampleFile)).toEqual([ { courseId: 'AP03', index: 1, type: 'D1', capacity: 25, time: 'V 9:00-12:00', group: 'F1', room: 'B103' }, { courseId: 'AP03', index: 1, type: 'D2', capacity: 24, time: 'V 13:00-16:00', group: 'F1', room: 'B103' } ]);
        }); 
    });

});