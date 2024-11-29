/** 
 * UTT/GL02 > Outil de suivi d'occupation de salles de cours de la SRU
 * @author = Caroline VEAU, Alice GUIBEREAU, He HUANG, Romain SCHAEFFER
*/ 

// Importations

const fs = require('fs'), readline = require('readline');
const vg = require('vega');
const vegalite = require('vega-lite');
const color = require("colors");
const path = require('path');
const { FILE } = require('dns');

// Variables globales

var tab = []; // Tableau temporaire pour certains pushs
const daysLong = ['?','LUN','MAR','MER','JEU','VEN','SAM','DIM'];
const daysShort = ['?','L','MA','ME','J','V','S','D'];
const months = ['Janvier','Février','Mars','Avril','May','Juin','Juillet','Août','Septembre','Obtobre','Novembre','Décembre'];
const options = ['Rechercher par cours', 'Rechercher par salle', 'Rechercher par plage horaire', 'Générer un fichier iCalendar', 'Suivre l\'occupation des locaux', 'Ajouter un créneau pour un cours','Générer classement des salles', 'Quitter l\'application'];
const slotFields = ['le type (CM,TD,TP)','l\'effectif maximal','le jour (L,MA,ME,J,V,S,D)','la plage horaire (hh:mm-hh:mm)','la salle de classe'];
// Correctif : le programme va demander une seule fois à l'utilisateur de spécifier le dossier de data.

var dataObj = {"courses": []};
var dataPath = null;
var menu, submenu, file = {"courses": []};

// Fonctions principales (imbriquées)

/**
 * Fonction lancée au lancement du programme. Toutes les autres fonctions sont imbriquées dans celle-ci.
*/
function main() {
	console.log('\n ╔═════════════════════════════════════════════════════╗'.yellow)
	console.log('    Bienvenue dans l\'utilitaire de suivi d\'occupation.'.yellow);
	console.log(' ╠═════════════════════════════════════════════════════╣'.yellow)
	// Affichage des options du menu
	for (var i=0;i<options.length;i++) {
		console.log(`   ${i+1}. ${options[i]}`); 
	}
	console.log(' ╚═════════════════════════════════════════════════════╝'.yellow);
	
	menu = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	menu.question('\n</> : '.yellow, function(input) {
		menu.close(); // Fermeture de la saisie
		if (input=='back' || input=='exit') {
			// Sortie de l'interface
		} else if (parseInt(input)>8) {
			console.clear();
			console.log('\n (!) Erreur : Index incorrect.'.red);
			main();
		} else if (input>'0' && input<='7') { // Options qui nécessitent un fichier existant
			newTab(input);
			fileInput(input);
		} else if (input=='8') { // Quitter l'application
			console.log('> Au revoir !');
		} else { // Erreur de saisie
			console.clear();
			console.log('\n (!) Erreur : Index incorrect.'.red);
			main();
		}
	});
}

/**
 * ( Appelée dans fileInput() ci-dessous. )
 * Fonction recursive qui regarde si le dossier actuel contient un
 * fichier .cru, et s'appelle recursivement si le dossier contient 
 * un autre dossier. Regarde aussi si le dossier contient des
 * fichiers d'extensions autres que .cru
 * @param {*} path le dossier principal de fichiers .cru
 * @returns containsCru : booléen : true si le dossier contient un/des .cru
 * @returns containsOnlyCru : booléen : true s'il y a QUE des fichiers .cru
 */
function verifyPathContainsCru(path) {	
	let containsCru = false;
	let containsOnlyCru = true;
    var files = fs.readdirSync(path);
	for (var i=0; i<files.length; i++){
		var filePath = path + '/' + files[i];
		var extension = files[i].split('.'); //la dernière partie de 'extension' est l'extension
		if (fs.lstatSync(filePath).isDirectory()){
			[containsCru,containsOnlyCru] = verifyPathContainsCru(filePath);
		} else if (extension[(extension.length)-1]=='cru'){
			containsCru = true;
		} else if (extension[(extension.length)-1]!='cru'){
			containsOnlyCru = false;
		}
		return [containsCru,containsOnlyCru];
	}
}

/**
 * Fonction pour demander la saisie du chemin vers un fichier .cru
 * @param indexOption Option sélectionnée par l'utilisateur dans main()
*/
function fileInput(indexOption) {
	if (JSON.stringify(dataObj) !=JSON.stringify({"courses": []})){ //Si la data à déja été demandée
		goToOptionChoisie(indexOption); //alors on passe à la suite
	} else {
		menuD = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		menuD.question('</> Entrez le chemin vers le dossier data ou se trouvent les fichiers .cru : '.yellow, function (inputPath) {
			menuD.close(); // Fermeture de la saisie
			if (inputPath=='back') { // Retour en arrière
				console.clear();
				main();
			} else if (inputPath=='exit') {
				// Sortie de l'interface
			} else {
				[containsCru,containsOnlyCru] = verifyPathContainsCru(inputPath);
				if (containsCru==false){
					console.log(' (!) Le dossier fourni ne contient pas de fichiers cru.'.red);
					fileInput(indexOption);
				} else if (containsOnlyCru==false){
					console.log(' (!) Le dossier fourni ne contient pas que des fichiers cru.'.red);
					fileInput(indexOption);
				} else {
					dataPath=inputPath;
					analyseData(indexOption);
				}
			}
		});
	}
}

/**
 * ( Appelée dans analyseData() ci-dessous. )
 * Fonction recursive qui prends tous les cours de tous les fichiers cru
 * contenus dans le dossier path, et les ajoute dans dataRaw.
 * @param {*} path le dossier principal de fichiers .cru
 * @returns dataRaw les cours à la suite
 */
function concatenerData(dataRaw, path) {
    var files = fs.readdirSync(path);
	for (var i=0; i<files.length; i++){
		var filePath = path + '/' + files[i];
		if (fs.lstatSync(filePath).isDirectory()){
			dataRaw = concatenerData(dataRaw,filePath);
		} else {
            try {
				var fileData = fs.readFileSync(filePath, 'utf8').trim(); // Tentative d'ouverture du fichier avec le chemin fourni
			} catch (err) { // Impossible d'ouvrir le fichier
				console.log(err);
			} 
            if (fileData=='') { // Fichier vide
				console.log(' (!) Fichier '+filePath+' existant mais vide.');
			} else {
                var courses = fileData.split(/(?=[+])|(?<=[+])/g); //RegEx pour split avec '+' mais en conservant le '+'
                for (var i=4;i<courses.length;i++) {
                    dataRaw += courses[i];
                }
			}            
        }
    }
    return dataRaw;
}

/**
 * Fonction permettant l'analyse du fichier .cru et le stockage dans un objet au format JSON pour faciliter le traitement des données.
 * @param indexOption Option sélectionnée par l'utilisateur dans main()
 * @param dataRaw Chaîne de caractère contenant l'intégralité du fichier issu du lien fourni dans fileInput()
*/
function analyseData(indexOption) {
	// Découpage du fichier pour récupérer les informations nécessaires et créer l'objet JSON dataObj
	var dataRaw = '';
	dataRaw= concatenerData(dataRaw,dataPath);
	var courses = dataRaw.split('+');
	for (var i=2;i<courses.length;i++) {
		var slot = courses[i].split('\r\n');
		// Stockage du nom du cours
		dataObj["courses"].push({"course":slot[0],"slots":[]});
		for (var j=1;j<slot.length;j++) {
			if (slot[j]!='') {
				var infos = slot[j].split(',');
				if (infos[1]!=undefined) {
					switch (infos[1][0]) {
						case 'C': infos[1]='CM'; break;
						case 'D': infos[1]='TD'; break;
						case 'P': infos[1]='TP'; break;
						default: infos[1]='?'; break;
					}
					var time = infos[3].replace('H=','').split(' '), day = daysShort.indexOf(time[0]);
					// Stockage d'un créneau
					dataObj["courses"][i-2]["slots"].push({"type":infos[1],"max":parseInt(infos[2].replace('P=','')),"day":day,"startHour":time[1].split('-')[0],"endHour":time[1].split('-')[1],"room":infos[5].replace('S=','').replace('//','')});
				}
			}
		}
	}
	goToOptionChoisie(indexOption);
}

function goToOptionChoisie(indexOption){
	// Envoi de l'objet dans la fonction choisie par l'utilisateur dans main()
	switch (indexOption) {
		case '1': searchByCourse(); break;
		case '2': searchByRoom(); break;
		case '3': searchByTime(); break;
		case '4': inputDates('début'); break; 
		case '5': monitoring(); break;
		case '6': addCourse(); break;
		case '7': generateRoomRanking(courses);break;
	};
}

// Fonctions secondaires (imbriquées)

/////////// /////////// RECHERCHE SALLE PAR COURS /////////// ///////////

/**
 * Fonction qui répond à la demande: pour un cours, l'ensemble des salles associées
 */
function searchByCourse() {
	NumCourse = readline.createInterface({
		// Ce qu'on met en input et output, doit être un cours
		input: process.stdin,
		output: process.stdout
	});

	// Demander pour un cours l'ensemble des salles associées
	NumCourse.question('\n</> Nom du cours : '.yellow, function (courseInput) { // Demande de remplir le nom du cours et met ce qui est entré dans 'cours'
		NumCourse.close();	// Fermeture de la saisie
		courseInput = courseInput.toLowerCase();
		if (courseInput=='back') { // Retour en arrière
			main();
		} else if (courseInput!='exit') { // Déroulement normal car la salle 'exit' ne sera trouvée.
			// Les salles à trouver dans la base de données
			courseInput = courseInput.toUpperCase();
			var listRooms = []; // Création d'un tableau pour les salles
			var validCourse = false;
			for (var i=0; i < dataObj["courses"].length;i++){ // Cherche dans tout le tableau
				if(dataObj["courses"][i]["course"] == courseInput) { // Si ce qui est dans 'cours' est bien dans le tableau (dans les data)
					validCourse=true;
					console.log('\n> La ou les salles associée(s) à ce cours est/sont : ');
					for (var j = 0; j< dataObj["courses"][i]["slots"].length;j++){ // Cherche réponse demandée dans tout le tableau par rapport à ce qui est en entrée
						if (listRooms.indexOf(dataObj["courses"][i]["slots"][j]["room"])==-1) { // Si la salle n'a pas été déjà ajoutée
							listRooms.push(dataObj["courses"][i]["slots"][j]["room"]); // Ajoute la salle dans le tableau temporaire	
							console.log(listRooms.length.toString().green + '. '.green + dataObj["courses"][i]["slots"][j]["room"].green); // Imprime le num de la réponse et la salle qui correspond au cours en entrée
						}
					}				
				} 		
			}
			if (validCourse == false) { // Cours non trouvé
				console.log(' (!) Le cours renseigné n\'existe pas ou n\'est pas reconnu'.red);
				searchByCourse(); // Retour au moment d'entrer un cours
			} else if (listRooms.length == 0) { // Aucune salle
				console.log(' (!) Aucune salle n\'est attribuée à ce cours'.red);
				main();
			}
			else if(validCourse)
			{
				main();
			}
		}
	});
}

/////////// /////////// RECHERCHE DE CAPACITE SALLE PAR SALLE /////////// ///////////

/**
 * Fonction qui demande: pour une salle donnée, la capacité maximale d'assise
 */
function searchByRoom() {
	// Demander pour une salle donnée capacité max d'assise
	NumRoom = readline.createInterface({
		// Ce qu'on met en input et output, doit être une salle
		input: process.stdin,
		output: process.stdout
	});

	NumRoom.question('\n</> N° de salle : '.yellow, function (salle) {	// Demande de remplir le n° de salle et met ce qui est entré dans 'salle'
		NumRoom.close(); // Fermeture de la saisie
		// Le nb d'assise à trouver ds BD
		var place = 0;	// Création variable place
		salle = salle.toUpperCase();
		for (var i = 0; i < dataObj["courses"].length; i++) { // Cherche dans tout le tableau (de data)									
			for (var j = 0; j< dataObj["courses"][i]["slots"].length; j++) { // Cherche dans tout le tableau de la catégorie 'slots'						
				if(dataObj["courses"][i]["slots"][j]["room"] == salle) { // Si il existe la salle qui est en entrée dans les data
					if(dataObj["courses"][i]["slots"][j]["max"] > place) { // Si le nb de place dans la salle est supérieure à 'place' qui est pour le moment =0
						place = dataObj["courses"][i]["slots"][j]["max"]; // Alors, place prend la valeur la plus grande trouvée pour la salle en entrée
					}					
				}
			}
		}
		if (salle.toLowerCase() == 'exit') { // Si, à la place de taper une salle, on tape exit, on sort de l'application
			// Sortie de l'interface
		} else if (salle.toLowerCase() == 'back') { // Si, à la place de taper une salle, on tape back, on revient au menu principal
			console.clear();
			main();
		} // Gestion des erreurs
		else if (place == 0 ) { // Le nb de place = 0 donc il n'y a pas de place donc la salle n'est pas salle et n'est pas reconnue
			console.log('La salle renseignée n\'existe pas ou n\'est pas reconnue'.red);
			searchByRoom();	// Retour au moment d'entrer une salle
		} else if (salle[0]<'A' || salle[0]>'Z') {	// On vérifie que le premier caractère en entrée est bien une lettre
			console.log('La salle renseignée n\'existe pas ou n\'est pas reconnue'.red);
			searchByRoom(); // Retour au moment d'entrer une salle
		} else {				
			console.log('\n> Le nombre de places maximal dans la salle '.green+salle.toString().green+' est : '.green + place.toString().green); // Afficher place qui correspond au max de place dans la salle en input
			main();
		}																	
	});
}

/////////// /////////// RECHERCHE DE SALLES PAR CRENEAUX /////////// ///////////

/**
 * Fonction pour connaître les salles disponibles pour un créneau choisi
*/
function searchByTime() {
	timeInput(0, 'début');	
}

/**
 * Fonction pour rentrer les inputs de début et de fin du créneau voulu
 * @param inputNumber correspond à l'index de l'input renseigné par l'utilsiateur dans dayMenu
 * @param instruction permettant d'afficher soit "début" / soit "fin" pour la saisie utilisateur
*/
function timeInput (inputNumber, instruction){
	var dayMenu = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
	dayMenu.question(`</> Saisir le jour et l'heure de ${instruction} (JJJ/hh/mm) : `.yellow, function (input) {
	  	dayMenu.close();
	  	var num1 =input.split('/')[1];
		var num1ANumber = true;
		for(var i=0;i<num1.length;i++)
		{
			if(!Number.isInteger(parseInt(num1[i])))
			{
				num1ANumber = false;
			}
		}
		var num2 =input.split('/')[2];
		var num2ANumber = true;
		for(var i=0;i<num2.length;i++)
		{
			if(!Number.isInteger(parseInt(num2[i])))
			{
				num2ANumber = false;
			}
		}
		if (input=='exit') {
	  		// Sortie de l'interface
	  	} else if (input=='back') {
	  		console.clear();
	  		main();
	  	} else if (input.split('/').length == 3 && ['LUN','MAR','MER','JEU','VEN','SAM','DIM'].indexOf(input.split('/')[0]) != -1 && num1ANumber && num2ANumber && parseInt(input.split('/')[2]) >= 0 && parseInt(input.split('/')[2]) < 60 &&  parseInt(input.split('/')[1]) >= 0 && parseInt(input.split('/')[1]) < 24) { // Première validation du format de l'input
			if(inputNumber==0){
	  			// Dans le cas du premier input (heure de debut)
				  if(input.split('/')[1].length == 2 && input.split('/')[2].length == 2){
					tab.push([input.split('/')[0],[input.split('/')[1],input.split('/')[2]].join(':')]);
					timeInput(1, 'fin');
				} else {
					console.log(' (!) Erreur de saisie'.red);
					timeInput(inputNumber, instruction);
				}	
	  		} else if (inputNumber==1) { //dans le cas du deuxième input, on vérifie sa cohérence avec le premier input
  				// Si il y a cohérence, on peut passer à la fonction analyseTime()
  				if(input.split('/')[1].length == 2 && input.split('/')[2].length == 2){
					tab.push([input.split('/')[0],[input.split('/')[1],input.split('/')[2]].join(':')]);
  					analyseTime();
	  			// Si ce n'est pas cohérent, l'utilisateur est renvoyé à timeInput(1)		
	  			} else {
	  				console.log(' (!) Erreur de saisie'.red);
	  				timeInput(inputNumber, instruction);
	  			}	
	  		}
	 	} else {
	 		console.log(' (!) Erreur de saisie'.red);
	 		timeInput(inputNumber, instruction);
	 	}
	});
}

/**
 * Fonction pour comparer le créneau renseigné par l'utilisateur aux horaires de disponibilité des salles
*/
function analyseTime(){
	// Création du tableau avec toutes les salles
	var allRooms = []
	for(var i = 0 ; i < dataObj.courses.length ; i++){
		for(var j = 0 ; j < dataObj.courses[i].slots.length ; j++){
			if(allRooms.indexOf(dataObj.courses[i].slots[j].room) == -1){
				allRooms.push(dataObj.courses[i].slots[j].room)
			}
		}
	}
	
	if(tab[0][0] != tab[1][0]){ // Plusieurs jours
		var middleDays = daysLong.slice(daysLong.indexOf(tab[0][0])+1, daysLong.indexOf(tab[1][0]));
	} else if (tab[0][0] == tab[1][0] && parseFloat(tab[0][1].replace(':','.')) > parseFloat(tab[1][1].replace(':','.'))) { // Plusieurs jours
		var middleDays = daysLong.filter(function (f) { return (f != tab[0][0] && f != '?')});
	} else { // Un seul jour
		var middleDays = [];
	}
	for(var i = 0 ; i < dataObj.courses.length ; i++){
		for (var j = 0 ; j < dataObj.courses[i].slots.length ; j++) {
			var startHour1 = parseFloat(tab[0][1].replace(':','.'));
			var endHour1 = parseFloat(tab[1][1].replace(':','.'));
			var startHour2 = parseFloat(dataObj["courses"][i]["slots"][j]["startHour"].replace(':','.'));
			var endHour2 = parseFloat(dataObj["courses"][i]["slots"][j]["endHour"].replace(':','.'));
			var day = daysLong.indexOf(tab[0][0])
			if (tab[0][0] != tab[1][0] && dataObj.courses[i].slots[j].day == daysLong.indexOf(tab[0][0])) { // Cas plusieurs jours, jour de début
				endHour1 = 24;
			} else if (tab[0][0] != tab[1][0] && dataObj.courses[i].slots[j].day == daysLong.indexOf(tab[1][0])) { // Cas plusieurs jours, jour de fin
				startHour1 = 0
				day = daysLong.indexOf(tab[1][0]);
			}
			// Vérification de l'occupation
			// Si même jour mais heureDébut après heureFin, on inverse la vérification
			if (tab[0][0] == tab[1][0] && parseFloat(tab[0][1].replace(':','.')) > parseFloat(tab[1][1].replace(':','.'))) {
				if (dataObj.courses[i].slots[j].day == day && allRooms != [] && allRooms.indexOf(dataObj.courses[i].slots[j].room) != -1 && (endHour1 > startHour2 || startHour1 < endHour2)) {
	            	allRooms = allRooms.filter(function (f) { return f != dataObj.courses[i].slots[j].room});
	            }
			} else { // Cas normal
				if (dataObj.courses[i].slots[j].day == day && allRooms != [] && ((startHour1<=startHour2 && startHour2<endHour1) || (endHour2<=endHour1 && endHour2>startHour1) || (startHour2<=startHour1 && endHour1<=endHour2)) && allRooms.indexOf(dataObj.courses[i].slots[j].room) != -1) {
                	allRooms = allRooms.filter(function (f) { return f != dataObj.courses[i].slots[j].room});
            	}
			}
            // Jours entre le jour de début et le jour de fin : salles occupées
            if(allRooms != [] && middleDays != [] && middleDays.indexOf(daysLong[dataObj.courses[i].slots[j].day]) != -1){
				allRooms = allRooms.filter(function (f) {return f != dataObj.courses[i].slots[j].room});
			}
		}
	}
	// Affichage du résultat
	if (allRooms.length == 0) {
		console.log('>> Aucune salle n\'est actuellement disponible pour ce créneau'.green);
	} else {
		console.log('>> Salle(s) dispo(s) : '.green + allRooms.toString().green);
	}
	main();
}

/////////// /////////// GENERATION D'UN FICHIER iCALENDAR /////////// ///////////

/**
 * (SPEC 5) Création d'un fichier au format iCalendar, fonction qui permet de récupérer les dates de début et de fin du calendrier
 * @param instruction Message de personnalisation de la question posée à l'utilisateur ('début' ou 'fin')
 */
function inputDates(instruction) {
	if (instruction=='début') {
		tab = [];
	}
	var calMenu = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
	calMenu.question(`</> Saisir la date de ${instruction} (JJ/MM/AA → ex : 01/03/23) du calendrier : `.yellow, function (input) {
	  	calMenu.close();
	  	if (input=='exit') {
	  		// Sortie de l'interface
	  	} else if (input=='back') {
	  		console.clear();
	  		main();
	  	} else if (dateObjectConstruction(input)==false) {
	  		console.log(' (!) Erreur de saisie de la date'.red);
	  		inputDates(instruction);//Recommence la fonction
	  	} else if (instruction=='début') {
	  		tab.push(input);
	  		inputDates('fin');
	  	} else {//Lorsque la date de début et de fin sont entrées correctement
	  		if (input < tab[0]) {
	  			console.log(' (!) La seconde date renseignée doit être postérieure à la première, les dates ont été inversées'.red);
	  			tab.push(tab[0]);
	  			tab[0]=input;
	  			inputCourses();
	  		} else {
	  			tab.push(input);
	  			inputCourses();
	  		}
	  	}
	});
}

/**
 * Fonction qui permet de récupérer les cours entrées par l'utilisateur pour créer un calendrier
 */
function inputCourses() {
	console.log('\n> Liste des cours disponibles dans la base de donnée : ');
	var listCourses = [];
	for (var i=0;i<dataObj.courses.length;i++) {
		listCourses.push(dataObj.courses[i].course);
		console.log(` ${i+1}. ${dataObj.courses[i].course}`);
	}
	var courseMenu = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
	courseMenu.question(`</> Parmi la liste ci dessus, saisir les cours à ajouter dans le calendrier en séparant par une virgule (ex : GL02,IF37) : `.yellow, function (input) {
		courseMenu.close();

		if (input=='exit') {
			// Sortie de l'interface
		} else if (input=='back') {
			console.clear();
			main();
		} else {
			var format = true;
			for (var i=0;i<input.split(',').length;i++) {
				if (listCourses.indexOf(input.split(',')[i])==-1) {
					format = false;
				}
			}
			if (format == false) {
				console.log(' (!) Erreur de format ou cours inexistant'.red);
				inputCourses();
			} else {
				createCal(dataObj,tab[0],tab[1],input.split(','));
			}
		}
	});
}

/**
 * Une fonction qui permet de faire la traduction de la date de numéro à anglais.
 * @param day Une chiffre qui présente le jour
 * @returns Abréviation en anglais
 */
function dayConvert(day) {
	let dayStr
	switch (day) 
	{
		case 1: dayStr="MO"; break;
		case 2: dayStr="TU"; break;
		case 3: dayStr="WE"; break;
		case 4: dayStr="TH"; break;
		case 5: dayStr="FR"; break;
		case 6: dayStr="SA"; break;
		case 7: dayStr="SU"; break;
	}	
	return dayStr;
}

/**
 * Une fonction pour trouver les cours séléctionés par l'utilisateur.
 * @param dataObj Liste des cours entier (dispensable, variable globale)
 * @param startDayStr Jour de début (objet Date) 
 * @param endDayStr Jour de fin (objet Date)
 * @param listCourse Liste des cours séléctionés par l'utilisateur (Objet JSON)
 */
function createCal(dataObj,startDayStr,endDayStr,listCourse) {
	// Création d'objets à partir des entrées utilisateurs
	let startDate = dateObjectConstruction(startDayStr);
	let endDate = dateObjectConstruction(endDayStr);
	if (startDate == false || endDate == false) { // Vérification optionnelle (déjà présente avant)
		console.log('Date is not valid !');
		inputDates('début');
	} else { 
		let listValid = [];
		for (let i = 0;i < dataObj.courses.length;i++) {
			for (let j = 0; j < listCourse.length; j++) {
				if(dataObj.courses[i].course == listCourse[j])
					listValid.push(dataObj.courses[i]); // Création d'un objet avec tous les cours sélectionnés par l'utilisateur
			}
		}
		// Envoi vers la construction du iCalendar
		outputFormatter(startDate,endDate,listValid);
	}
}


/**
 * Construire un objet Date 
 * @param dateStr date saisie par l'utilisateur dans le format JJ/MM/AA
 * @returns false if date is invalide, a Date object if date is valide.
 */
function dateObjectConstruction(dateStr) {
	// Format
	if (!/^\d{1,2}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
		return false;
	}

 	// Séparation du format
	let listDate = dateStr.split("/");
	let day = parseInt(listDate[0], 10);
	let month = parseInt(listDate[1], 10) -1 ;
	let year = parseInt('20' + listDate[2], 10);
 
	// Check the ranges of month and year
	if (year < 0 || year > 2099 || month < 0 || month > 11) { 	
		return false;
	}
 
 	// Taille des mois
	let monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
	if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {   
		monthLength[1] = 29;
	}
 
	// Check the range of the day
	if(day <= 0 || day > monthLength[month - 1]) {	
		return false;
	} else {
		let dateObj = new Date(year,month,day+1);
		let today = new Date();
		// Si date avant date du jour
		if (today >= dateObj) {
			console.log("La date donnée ne peux être antérieur à la date du jour !".red);
			return false;
		} else {
			return dateObj;
		}
	}
}

/**
 * Formatage des données au format iCal
 * @param start Date de début choisie par utilisateur
 * @param end Date de fin choisie par utilisateur 
 * @param listValid Liste des cours entrés par l'utilisateur avec toutes les infos 
 */
function outputFormatter(start,end,listValid) {
	// Format de début de fichier
	let eventStr = "BEGIN:VCALENDAR\n";
	for (let i = 0;i < listValid.length; i++) {
		for (let j = 0; j < listValid[i].slots.length; j++) {
			let mStart = String(start.getMonth() + 1).padStart(2,'0'); // Mois de départ au bon format (Date indexe à 0)
			let mEnd = String(end.getMonth() + 1).padStart(2,'0'); // Mois de fin au bon format (Date indexe à 0)
			let dayNb = start.getDay(); // Variable correspondant à l'index du jour : 0 = Sunday / 1 = Monday
			if (dayNb==0) dayNb=7; // Remise de Sunday = 7
			if ((start.getDate() + listValid[i].slots[j].day - dayNb) < end.getDate()) {
				// Création d'un créneau avec toutes les infos
				eventStr +=(
				"BEGIN:VEVENT\n"
				+	"SUMMARY:" + listValid[i].slots[j].type + " of " + listValid[i].course +"\n"
				+ 	"LOCATION:" 
				+  	listValid[i].slots[j].room + "\n"
				+ 	"DESCRIPTION:"
				+ 	"You have a " + listValid[i].slots[j].type + " of " + listValid[i].course + " in "+ listValid[i].slots[j].room + "\n" 
				+ 	"DTSTART:"
				+ 	start.getFullYear() 
				+ 	mStart
				+ 	String(start.getDate() + listValid[i].slots[j].day - dayNb).padStart(2, '0')  + "T"
				+ 	listValid[i].slots[j].startHour.replace(":","").padStart(4, '0') + "00\n"
				+ 	"DTEND:"
				+ 	end.getFullYear()
				+	mStart
				+ 	String(start.getDate() + listValid[i].slots[j].day - dayNb).padStart(2, '0') + "T"
				+ 	listValid[i].slots[j].endHour.replace(":","").padStart(4, '0') + "00\n");
				// Fréquence de répétition du créneau
				eventStr += "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=" 
				+ 	dayConvert(listValid[i].slots[j].day) + ";UNTIL="
				+ 	end.getFullYear() + mEnd + String(end.getDate()-1).padStart(2, '0') + "T210000Z\n" 
				+ 	"END:VEVENT" + "\n";
			}
		}
	}
	// Format de fin de fichier
	eventStr += "END:VCALENDAR";
	// Écriture dans le fichier
	// console.log(eventStr);
	if (eventStr=="BEGIN:VCALENDAR\nEND:VCALENDAR") {
		console.log("Aucun cours sélectionné n'a de créneaux sur la période mentionnée.\n".red);
		main();
	} else {
		fs.writeFile("cal.ics", eventStr, (err) => {
			if (err)
			  console.log(err);
			else  {
			  console.log("File written successfully\n".green);
			  main();
			}
		});
	}
	
}

/////////// /////////// MONITORING DES SALLES /////////// ///////////

/**
 *  (SPEC6) Fonction permettant de calculer le taux d'occupation pour un temps donné
 */ 
function monitoring() {
	// Demander le temps considéré (1 semaine, 1 mois, 1an)
	// Variables
	const duree = ['Par semaine', 'Par mois', 'Par an'];
	var heures, occupation;
	var taux = occupation*100/heures;

	var date = new Date();

	// Variables pour récupérer date
	var jour = date.getDay() // renvoie jour de la semaine sous forme de chiffre (0 = dimanche, 1 = lundi, ..., 6 = samedi)
	// var day = date.getDate() // renvoie jour du mois en chiffres
	var mois = date.getMonth() // renvoie numéro du mois (0 = janvier, 1 = février, ..., 11 = décembre)
	var annee = date.getFullYear() // renvoie année en 4 chiffres

	/**
	* Fonction lancée pour connaître le temps considéré pour le calcul du taux d'occupation
	*/
	console.log('\n(!) Merci de choisir une durée pour le calcul du taux d\'occupation.'.yellow);
	// Affichage des options du menu
	for(var i=0; i<duree.length; i++){
		console.log(` ${i+1}. ${duree[i]}`);
	}

	// L'utilisateur entre une option
	var temps = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	// Traitement de l'option choisie, renvoie à des fonctions ultérieures en fonction de l'index choisi
	temps.question('\n</> : '.yellow, function(entree){
		temps.close(); // Fermeture de la saisie
		if (entree == '1') {
			week();
		} else if (entree == '2') {
			month();
		} else if (entree == '3') {
			year();
		} else if (entree=='back'){ // Retour en arrière
			console.clear();
			main();
		} else if (entree=='exit'){
			// Sortie de l'interface
		} else {
			console.log(' (!) Erreur : Index incorrect.'.red);
			monitoring();
		}
	});

	/*
	* Fonction pour savoir si une année est bissextile ou non
	*/
	function IsBissextile(year) {
		if((year%4==0) && ((year%100!=0) || (year%400==0))) {
			return true; // 29 jours en février et 366 jours en 1 an
		} else return false; // 28 jours en février et 365 jours en 1 an
	}

	/*
	* Fonction s'appliquant si la durée entrée est 1 semaine
	*/
	function week() {
		var totalHourWeek = 72;
		var tabTemp = {}; // Création de variables, l'une pour le nombre d'heure dans une semaine, l'une pour créer un tableau dans lequel on va pouvoir mettre les cours et la dernière variable va permettre de mettre les heures d'occupation pour ces cours
		for (var i=0;i<dataObj.courses.length;i++) { // Chercher dans le tableau de data les cours
			for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Chercher dans le tableau dans la catégorie "slots"
				if (Object.keys(tabTemp).indexOf(dataObj.courses[i].slots[j].room)) { // Si dans le tableau de cours, un cours n'existe pas dans une salle
					tabTemp[dataObj.courses[i].slots[j].room] = calculHours(dataObj.courses[i].slots[j].room); // Ajouter au tableau d'heures, le calcul des heures (fonction ultérieure) pour une salle si celle-ci existe dans le tableau de data
				}
			}
		}

		var strExport = '';
		// Construction affichage
		Object.keys(tabTemp).forEach(element => strExport += `> ${element} : ${tabTemp[element]}h >>> Taux horaire : ${100*tabTemp[element]/totalHourWeek}%\n`.green);
		console.log(strExport);
		// Construction affichage pour VEGA
		var avgTab = [];
		Object.keys(tabTemp).forEach(function (element) {
			avgTab.push({"salle":element,"taux":100*tabTemp[element]/totalHourWeek});
		});
		var avgChart = {
			"$schema": "https://vega.github.io/schema/vega-lite/v3.json",
			"data": {
		    	"values": avgTab
			},
		  "mark": "bar",
		  	"encoding": {
			    "y": {
			      	"field": "salle",
			      	"title": "Salles"
			    },
			    "x": {
			      	"field": "taux",
			      	"type": "quantitative",
			      	"title": "Taux d'occupation (en %)"
			    }   
		 	}
		}
		exportToVega(avgChart);
		exportToFile(strExport); // Exporter dans un fichier, voir la fonction ultérieurement

		/*
		* Fonction calculant le nombre d'heure pour une salle donnée
		*/
		function calculHours(selectRoom) {
			var sum = 0; // Création d'une variable calculant la somme des heures où une salle est occupée
			for (var i=0;i<dataObj.courses.length;i++) { // Cherche dans le tableau de data les cours
				for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Cherche dans le tableau de data les cours dans la catégorie "slots"
					var dataSlot = dataObj.courses[i].slots[j]; // Création d'une variable correspondant à quelque chose dans la catégorie "slots"
					if (dataSlot.room==selectRoom) { // Si, dans le tableau, parmi les salles, il y a une salle donnée (correspondant à selectRoom)
						// On ajoute à la variable sum la différence entre les heures de fin et les heures de départ d'un cours pour une salle
						sum += (parseInt(dataSlot.endHour.split(':')[0]) + parseInt(dataSlot.endHour.split(':')[1])/60) - (parseInt(dataSlot.startHour.split(':')[0]) + parseInt(dataSlot.startHour.split(':')[1])/60);
					}
				}
			}
			return sum; // renvoie la variable sum correspondant au nombre d'heures pendant lesquelles une salle donnée est occupée
		}
	};

	/*
	* Fonction s'appliquant si la durée entrée est 1 mois
	*/
	function month() {
		// Création du tableau avec les salles de cours
		var tabTemp = {};
		var avgChart = {
			"$schema": "https://vega.github.io/schema/vega-lite/v5.json",
			"data": {
		    	"values": []
			},
		  	"layer":[]
		}
		for (var i=0;i<dataObj.courses.length;i++) { // Chercher dans le tableau de data les cours
			for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Chercher dans le tableau dans la catégorie "slots"
				if (Object.keys(tabTemp).indexOf(dataObj.courses[i].slots[j].room)==-1) { // Si dans le tableau de cours, un cours n'existe pas dans une salle
					tabTemp[dataObj.courses[i].slots[j].room] = 0;
					avgChart.layer.push({"mark":"line","encoding": {"x": {"field": "mois", "type":"nominal", "title":"Mois"},"y": {"field": dataObj.courses[i].slots[j].room,"type":"quantitative","title":"Taux d'occupation (en %)"},"color":{"datum": dataObj.courses[i].slots[j].room}}});
				}
			}
		}
		var actualDate = new Date();
		var year = actualDate.getFullYear();
		var strExport = `>> Résultats pour l'année ${year}\n`;
		// Boucle pour tous les mois
		for (var k=0;k<12;k++) {
			// Définition du premier jour du mois
			var startDate = new Date(year,k,1);
			// Initialisation du total d'heures par mois
			var totalHourMonth = 0;
			// Initialisation du nombre de jour dans le mois
			if ([0,2,4,6,7,9,11].indexOf(k) != -1) {
				var maxDays = 31;
			} else if (k==1 && !IsBissextile(year)) {
				var maxDays = 29;
			} else if (IsBissextile(year) && k==1) {
				var maxDays = 28;
			} else {
				var maxDays = 30;
			}
			var startDay = startDate.getDay();
			strExport += `--- ${months[startDate.getMonth()]} (${maxDays} jours) ---\n`;
			for (var h=0;h<maxDays;h++) { // Boucle sur tous les jours du mois
				for (var i=0;i<dataObj.courses.length;i++) { // Boucle sur les cours
					for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Boucle sur les créneaux
						var dataSlot = dataObj.courses[i].slots[j];
						if (dataSlot.day==startDay) { // Si le créneau se trouve le même jour que celui du mois
							tabTemp[dataSlot.room] += (parseInt(dataSlot.endHour.split(':')[0]) + parseInt(dataSlot.endHour.split(':')[1])/60) - (parseInt(dataSlot.startHour.split(':')[0]) + parseInt(dataSlot.startHour.split(':')[1])/60);
						}
					}
				}
				// Gestion des jours
				if (startDay==7) {
					startDay=1;
				} else {
					totalHourMonth += 12;
					startDay+=1;
				}
			}
			// Construction affichage pour VEGA
			avgChart.data.values.push({"mois":k+1});
			Object.keys(tabTemp).forEach(element => avgChart.data.values[k][element] = 100*tabTemp[element]/totalHourMonth);
			// Construction affichage
			Object.keys(tabTemp).forEach(element => strExport += `> ${element} : ${tabTemp[element]}h >>> Taux horaire : ${100*tabTemp[element]/totalHourMonth}%\n`.green);
			// Remise à 0
			Object.keys(tabTemp).forEach(element => tabTemp[element]=0);
		};
		// Affichage finale
		console.log(strExport);
		// Exportation SVG VEGA
		exportToVega(avgChart);
		// Exportation du string
		exportToFile(strExport); // Exporter dans un fichier, voir la fonction ultérieurement
	};

	/*
	* Fonction s'appliquant si la durée entrée est 1 an
	*/
	function year() {
		var tabTemp = {};
		for (var i=0;i<dataObj.courses.length;i++) { // Chercher dans le tableau de data les cours
			for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Chercher dans le tableau dans la catégorie "slots"
				if (Object.keys(tabTemp).indexOf(dataObj.courses[i].slots[j].room)==-1) { // Si dans le tableau de cours, un cours n'existe pas dans une salle
					tabTemp[dataObj.courses[i].slots[j].room] = 0;
				}
			}
		}
		var actualDate = new Date();
		var year = actualDate.getFullYear();
		// Initialisation du total d'heures par an
		var totalHourYear = 0;
		var strExport = `>> Résultats pour l'année ${year}\n`;
		// Boucle pour tous les mois
		for (var k=0;k<12;k++) {
			// Définition du premier jour du mois
			var startDate = new Date(year,k,1);
			// Initialisation du nombre de jour dans le mois
			if ([0,2,4,6,7,9,11].indexOf(k) != -1) {
				var maxDays = 31;
			} else if (k==1 && !IsBissextile(year)) {
				var maxDays = 29;
			} else if (IsBissextile(year) && k==1) {
				var maxDays = 28;
			} else {
				var maxDays = 30;
			}
			var startDay = startDate.getDay();
			for (var h=0;h<maxDays;h++) { // Boucle sur tous les jours du mois
				for (var i=0;i<dataObj.courses.length;i++) { // Boucle sur les cours
					for (var j=0;j<dataObj.courses[i].slots.length;j++) { // Boucle sur les créneaux
						var dataSlot = dataObj.courses[i].slots[j];
						if (dataSlot.day==startDay) { // Si le créneau se trouve le même jour que celui du mois
							tabTemp[dataSlot.room] += (parseInt(dataSlot.endHour.split(':')[0]) + parseInt(dataSlot.endHour.split(':')[1])/60) - (parseInt(dataSlot.startHour.split(':')[0]) + parseInt(dataSlot.startHour.split(':')[1])/60);
						}
					}
				}
				// Gestion des jours
				if (startDay==7) {
					startDay=1;
				} else {
					totalHourYear += 12;
					startDay+=1;
				}
			}
		}
		// Construction affichage
		Object.keys(tabTemp).forEach(element => strExport += `> ${element} : ${tabTemp[element]}h >>> Taux horaire : ${100*tabTemp[element]/totalHourYear}%\n`.green);
		// Construction affichage pour VEGA
		var avgTab = [];
		Object.keys(tabTemp).forEach(function (element) {
			avgTab.push({"salle":element,"taux":100*tabTemp[element]/totalHourYear});
		});
		var avgChart = {
			"$schema": "https://vega.github.io/schema/vega-lite/v3.json",
			"data": {
		    	"values": avgTab
			},
		  "mark": "bar",
		  	"encoding": {
			    "y": {
			      	"field": "salle",
			      	"title": "Salles"
			    },
			    "x": {
			      	"field": "taux",
			      	"type": "quantitative",
			      	"title": "Taux d'occupation (en %)"
			    }   
		 	}
		}
		exportToVega(avgChart);
		// Affichage finale
		console.log(strExport);
		// Exportation du string
		exportToFile(strExport); // Exporter dans un fichier, voir la fonction ultérieurement
	};

	function exportToVega(avgChart) {
		const myChart = vegalite.compile(avgChart).spec;
			
		/* SVG version */
		var runtime = vg.parse(myChart);
		var view = new vg.View(runtime).renderer('svg').run();
		var mySvg = view.toSVG();
		mySvg.then(function(res){
			fs.writeFileSync("./result.svg", res)
			view.finalize();
		});
	}

	/* 
	* Fonction permettant d'exporter dans un fichier une chaîne de caractères qui lui est envoyée
	*/
	function exportToFile(strExport) {
		var file = fs.writeFileSync('monitoringData.txt', strExport); // Création d'une variable créant un nouveau fichier si celui-ci n'existe pas déjà sous le nom 'monitoringData.txt' comportant les données de exportStr
		console.log("\n (!) Données écrites avec succès dans le fichier 'monitoringData.txt' !".green); // Imprime un message
		out(); // Renvoie à fonction pour revenir au menu
	};

	/*
	* Fonction demandant si l'utilisateur veut revenir au menu principal ou sortir de l'application
	*/
	function out() {
		console.log('\nRetour au menu principal, taper \'back\'. \nPour sortir de l\'application, taper \'exit\'. \nPour faire une autre recherche, taper \'yes\'');
		var back = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		// Traitement de l'option choisie, soit retour au menu principal, soit sortie de l'application
		back.question('\n</> : '.yellow, function(input){
			back.close(); // Fermeture de la saisie
			if (input == 'back') {
				console.clear();
				main();
			} else if (input == 'exit') {
				// Sortie de l'interface
			} else if (input == 'yes') {
				monitoring();
			} else {
				console.log(' (!) Erreur de syntaxe.'.red);
				out();
			};
		});
	};
};

/////////// /////////// GENERATION D'UN CLASSEMENT DES SALLES EN FONCTION DE LEUR CAPACITE D'ACCUEIL /////////// ///////////
/**
 * SPEC 7 Génération d’un classement des salles en fonction de leur capacité d’accueil.
 */
function generateRoomRanking(courses){
	console.clear();
	console.log('dataobj'+dataObj);
	
	var tabNomSalleCapacite =new Map();
	for(var i =0;i<courses.length-2;i++)
	{
		var maxPlaceForThisRoom = searchMaxPlaceForRoom(dataObj["courses"][i]["slots"]);
		if(!Array.from(tabNomSalleCapacite.keys()).includes(maxPlaceForThisRoom))
		{
			tabNomSalleCapacite.set(maxPlaceForThisRoom ,Array(dataObj["courses"][i]["slots"][0].room));
		}
		else
		{
			tabNomSalleCapacite.set(maxPlaceForThisRoom,tabNomSalleCapacite.get(maxPlaceForThisRoom).concat([dataObj["courses"][i]["slots"][0].room]));
		}
	}
	tabNomSalleCapacite = new Map([...tabNomSalleCapacite].sort((a, b) => a[0] - b[0]));
	console.log("Classement des salles en fonction de leurs capacites :".yellow);
	for(var i = 0;i<Array.from(tabNomSalleCapacite.keys()).length;i++)
	{
		console.log("Salle de ".yellow+Array.from(tabNomSalleCapacite.keys())[i]+" places :".yellow);
		var allRooms = "";
		for(var nomSalleIndex=0;nomSalleIndex<tabNomSalleCapacite.get(Array.from(tabNomSalleCapacite.keys())[i]).length;nomSalleIndex++)
		{
			allRooms +=tabNomSalleCapacite.get(Array.from(tabNomSalleCapacite.keys())[i])[nomSalleIndex].green;
			if(nomSalleIndex!=tabNomSalleCapacite.get(Array.from(tabNomSalleCapacite.keys())[i]).length-1)
			{
				allRooms+=",";
			}
		}
		console.log(allRooms);
	}
	main();
}

function searchMaxPlaceForRoom(allCourseForRoom)
{
	var currentMaxPlace = 0;
	for(var i=0;i<allCourseForRoom.length;i++)
	{
		if(currentMaxPlace< allCourseForRoom[i].max)
		{
			currentMaxPlace = allCourseForRoom[i].max;
		}
	}
	return currentMaxPlace;
}
/////////// /////////// AJOUT D'UN COURS/CRENEAU A UN FICHIER CRU /////////// ///////////

/**
 * (SPEC8) Fonction permettant d'ajouter un créneau pour un cours et stocker ce changement dans un fichier .cru. Cette première fonction addCourse() permet de demander à l'utilisateur le chemin vers un fichier .cru existant ou non.
*/
function addCourse() {
	menuC = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	console.log('\n (info) Format attendu : <cours>,<nombre_créneaux>');
	//menuC.question('</> Entrez le chemin vers un fichier existant ou non : '.yellow, function (input) {
	menuC.question('</> Saisir un cours et un nombre de créneau à ajouter : '.yellow, function (input) {
		menuC.close();
		if (input=='exit') {
			// Sortie de l'interface
		} else if (input=='back') {
			console.clear();
			main();
		} else if (!/^([a-zA-Z0-9\\\-_]*,[0-9])$/.test(input)){
			console.log(' (!) Format de fichier incorrect.'.red);
			addCourse();
		} else {
			/**
			 * Ici on cherche dans quel dossier on va mettre le nouveau cours (ex : data/AB/edt.cru)
			 */
			firstLetterOfCours = input.split(',')[0].charAt();
			var subfiles = fs.readdirSync(dataPath);
			for (var i=0; i<subfiles.length; i++){
				if (subfiles[i].includes(firstLetterOfCours)){
					var filePath = dataPath+'\\'+subfiles[i]+"\\edt.cru";					
					break;
				}	
			}
			try {
				var file = fs.appendFile(filePath, '', function (err) {
					if (filePath.split('.')[1]=='cru') { // Vérification du format .cru
						if (err) {console.log(err)}
						if (fs.readFileSync(filePath,'utf8')=='') { // Le fichier renseigné est vide
							console.log(' (!) Le fichier demandé n\'existe pas, un fichier à été créé en conséquence.'.red);
							// Création d'un fichier à l'emplacement indiqué par l'utilsateur
							fs.appendFile(filePath,'Nouveau fichier\r\n+UVUV\r\n+', function (err) {if (err) console.log(err);});
							// Envoi vers l'étape suivante
							courseInput(filePath,input);
						} else { // Le fichier renseigné est rempli
							// Envoi vers l'analyse du fichier, '6' permet d'effectuer aucune autre action par la suite de cette fonction
				//			analyseData('6',fs.readFileSync(filePath, 'utf8'));
							// Suite à l'analyse, envoi vers l'étape suivante
							courseInput(filePath,input);
						}
					} else if (fs.readFileSync(filePath)!='') { // Fichier pas au format .cru et non-vide, on ne le supprime pas
						console.log(' (!) Format de fichier incorrect.'.red);
						addCourse();
					} else { // Fichier pas au format .cru et vide, on le supprime
						console.log(' (!) Format de fichier incorrect.'.red);
						// Suppression du fichier venant d'être créé
						fs.unlinkSync(filePath, function (err) {if (err) console.log(err);});
						addCourse();
					}
				});
			} catch (err) { // Erreur le chemin renseigné est invalide
				console.log(" (!) Répertoire introuvable.".red);
			}
		}
	});
}

/**
 * Fonction faisant partie de la SPEC8.
 * @param filePath Chemin vers un fichier .cru rentré par l'utilisateur dans addCourse()
 * @parma input Nom du Cours a ajouter, suivi d'umne ',' et du nombre de créneaux à ajouter (ex : 'GL02,3' )
*/
function courseInput(filePath,input) {
	if (input.split(',').length==2 && input.split(',')[1]>'0' && Number.isInteger(parseInt(input.split(',')[1]))) { // Vérification du format saisie par l'utilsateur et de la présence d'un chiffre pour le nombre de créneaux
		// Envoi vers l'étape suivante
		slotInput(filePath,input.split(',')[0],0,parseInt(input.split(',')[1]),undefined);
	} else { // Erreur dans la saisie par l'utilisateur
		console.log(' (!) Erreur de saisie.'.red);
		courseInput(filePath);
	}
}

/**
 * Fonction faisant partie de la SPEC8 permettant à l'utilisateur de rentrer au fur et à mesure toute les informations relatives à un créneau : type, place max, jour, heure et salle.
 * @param filePath Chemin vers un fichier .cru rentré par l'utilisateur dans addCourse()
 * @param course Identifiant du cours rentré par l'utilisateur dans courseInput()
 * @param indexField Index permettant de choisir le champ de saisie : type, jour, heure...
 * @param NbSlotAdd Nombre de créneaux restants à ajouter (valeur initiale saisie dans courseInput())
 * @param slots Adresse vers le tableau de créneaux du cours choisi dans l'objet dataObj (initialisé à chaque nouveau créneau)
*/
function slotInput(filePath,course,indexField,NbSlotAdd,slots) {
	var addMenu = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if (indexField==0) { // Création d'un nouveau créneau
		console.log('\n<<<+ Nouveau créneau +>>>');
		var index;
		if (dataObj["courses"].length == 0) {
			dataObj["courses"].push({"course":course,"slots":[{"type":'',"max":'',"day":'',"startHour":'',"endHour":'',"room":''}]});
			index = 0;
		} else if (dataObj["courses"]) {
			var existCourse = false;
			for (var i=0;i<dataObj["courses"].length;i++) {
				if (dataObj["courses"][i]["course"] == course) { // Cours existant
					existCourse = true;
					index = i;
				}
			}
			if (existCourse) {
				dataObj["courses"][index]["slots"].push({"type":'',"max":'',"day":'',"startHour":'',"endHour":'',"room":''});
			} else {
				index = dataObj["courses"].length;
				dataObj["courses"].push({"course":course,"slots":[{"type":'',"max":'',"day":'',"startHour":'',"endHour":'',"room":''}]});
			}
		}
		var slots = dataObj["courses"][index]["slots"];
	}
	addMenu.question(`</> Saisir ${slotFields[indexField]} : `.yellow, function (input) {
		addMenu.close();
		if (input=='exit') {
			if (fs.readFileSync(filePath)=='Nouveau fichier\r\n+UVUV\r\n+') {
				fs.unlinkSync(filePath, function (err) {if (err) console.log(err);});
			}
			// Sortie de l'interface
		} else if (input=='back') {
			if (fs.readFileSync(filePath)=='Nouveau fichier\r\n+UVUV\r\n+') {
				fs.unlinkSync(filePath, function (err) {if (err) console.log(err);});
			}
			console.clear();
			main();
		} else {
			switch (indexField) { // Variation des actions selon les champs à compléter
				case 0: // Saisie du type (CM,TD ou TP)
					if (input=='CM' || input=='TD' || input=='TP') { // Vérification de la saisie
						slots[slots.length-1].type = input; // Mise à jour de l'objet dataObj
						indexField++; // Passage au champ de saisie suivant
					} else { // Erreur de saisie
						slots.pop(); // Suppression de l'objet slots qui sera recréé par la suite
						console.log(' (!) Saisie incorrecte du type de cours.'.red);
					}
					// Envoi vers indexField (le même si erreur, le suivant si saisie correcte)
					slotInput(filePath,course,indexField,NbSlotAdd,slots);
					break;
				case 1: // Saisie de la capacité maximale
					if (Number.isInteger(parseInt(input))) { // Vérification du format numérique
						slots[slots.length-1].max = parseInt(input); // Mise à jour de l'objet dataObj
						indexField++;  // Passage au champ de saisie suivant
					} else { // Erreur de saisie
						console.log(' (!) Saisie incorrecte de la capacité max.'.red);
					}
					// Envoi vers indexField (le même si erreur, le suivant si saisie correct)
					slotInput(filePath,course,indexField,NbSlotAdd,slots);
					break;
				case 2: // Saisie du jour
					if (['L','MA','ME','J','V','S','D'].indexOf(input) != -1) { // Vérification de la saisie par rapport à un tableau de possibilités
						slots[slots.length-1].day = ['L','MA','ME','J','V','S','D'].indexOf(input)+1; // Màj, envoi un numéro correspondant au jour dans l'objet dataObj
						indexField++; // Passage au champ de saisie suivant
					} else { // Erreur de saisie
						console.log(' (!) Saisie incorrecte du jour.'.red);
					}
					// Envoi vers indexField (le même si erreur, le suivant si saisie correct)
					slotInput(filePath,course,indexField,NbSlotAdd,slots);
					break;
				case 3: // Saisie de la plage horaire au format (hh:mm-hh:mm) ou également h:mm
					var goodFormat = true;
					var hours = input.split('-'); // Séparation des heures
					if (hours.length!=2 || parseFloat(hours[0].replace(':','.'))>=parseFloat(hours[1].replace(':','.'))) {goodFormat=false;} // Vérification format autour du "-" + vérification du bon ordre de saisie (heure de fin plus tard que l'heure de début)
					for (var i = 0;i<hours.length;i++) { // Boucle à deux tours : heure de début et heure de fin
						var number = hours[i].split(':'); // Séparation entre heures et minutes
						if (number.length!=2 || number[1].length!=2 || number[0].length>2) { // Vérification format autour ":" + compatibilité avec le format
							goodFormat=false; 
						} else if (Number.isInteger(parseInt(number[0]))==false || Number.isInteger(parseInt(number[1]))==false) { // Vérification du format numérique
							goodFormat=false;
						} else if (parseInt(number[0])<0 && parseInt(number[0])>24 && parseInt(number[1])>59 && parseInt(number[1])<0) { // Vérification de la sémantique
							goodFormat=false;
						}
					}
					if (goodFormat) { // Format compatible = màj de dataObj
						slots[slots.length-1].startHour = input.split('-')[0];
						slots[slots.length-1].endHour = input.split('-')[1];
						indexField++; // Passage au champ de saisie suivant
					} else {
						console.log(' (!) Saisie incorrecte de l\'horaire.'.red);
					}
					// Envoi vers indexField (le même si erreur, le suivant si saisie correct)
					slotInput(filePath,course,indexField,NbSlotAdd,slots);
					break;
				case 4: // Saisie de la salle
					if (input[0]>='A' && input[0]<='Z') { // Vérification minime du format de salle
						slots[slots.length-1].room = input; // Màj de dataObj
						// Début vérification de la cohérence générale de la saisie (conflit horaire-salle)
						var noConflict = true;
						for (var i=0;i<dataObj["courses"].length;i++) {
							for (var j=0;j<dataObj["courses"][i]["slots"].length;j++) {
								if (dataObj["courses"][i]["slots"][j].room==input && dataObj["courses"][i]["slots"][j].day==slots[slots.length-1].day && slots[slots.length-1] != dataObj["courses"][i]["slots"][j]) {
									var startHour1 = parseFloat(dataObj["courses"][i]["slots"][j]["startHour"].replace(':','.'));
									var startHour2 = parseFloat(slots[slots.length-1]["startHour"].replace(':','.'));
									var endHour1 = parseFloat(dataObj["courses"][i]["slots"][j]["endHour"].replace(':','.'));
									var endHour2 = parseFloat(slots[slots.length-1]["endHour"].replace(':','.'));
									if ((startHour2<=startHour1 && endHour2<=endHour1) || (startHour1<startHour2 && endHour2>endHour1) || (startHour1<startHour2 && endHour1<endHour2)) {
										noConflict = false;
									} else if ((startHour1<=startHour2 && endHour1<=endHour2) || (startHour2<startHour1 && endHour1>endHour2) || (startHour2<startHour1 && endHour2<endHour1)) {
										noConflict = false;
									}
								}
							}
						}
						if (noConflict==false) { // Conflit !
							console.log(` (!) Conlit : la salle ${slots[slots.length-1].room} est déjà occupée sur ce créneau (entrée supprimée, nouvelle saisie possible).`.red);
							slots.pop(); // Suppression des données saisies
							slotInput(filePath,course,0,NbSlotAdd,undefined); // Envoi vers une nouvelle saisie
						} else if (NbSlotAdd-1!=0) { // Saisie correcte et nouveau créneau à ajouter 
							slotInput(filePath,course,0,NbSlotAdd-1,undefined);
						} else { // Passage au formatage des données (étape suivante)
							formatShaping(filePath,course);
						}
					} else {
						console.log(' (!) Saisie incorrecte de la salle.'.red);
						slotInput(filePath,course,indexField,NbSlotAdd,slots);
					}
					break;
				default: console.log(' (!) Erreur champ de saisie non reconnue.'.red); break;
			}
		}
	});
}

/**
 * Fonction faisant partie de la SPEC8 servant à prendre toutes les données saisies et stockées dans dataObj pour les mettre au bon format (.cru) et les ajouter au fichier
 * @param filePath Chemin vers un fichier .cru rentré par l'utilisateur dans addCourse()
 * @param course Identifiant du cours rentré par l'utilisateur dans courseInput()
*/
function formatShaping(filePath,course) {
	var data = fs.readFileSync(filePath,'utf8').split('+'); // Séparation du fichier au niveau des "+"
	fs.writeFileSync(filePath,`${data[0]}+${data[1]}`,{encoding:'utf8',flag:'w'}); // Copie de l'en-tête
	for (var i=0;i<dataObj["courses"].length;i++) {
		subfileLetters = filePath.split('\\')[(filePath.split('\\').length-2)];
		let firstLetterOfCourse = dataObj["courses"][i]["course"].charAt();

		if (subfileLetters.includes(firstLetterOfCourse)){		
			// Ajout d'un nouveau cours
			fs.appendFileSync(filePath,`+${dataObj["courses"][i]["course"]}\r\n`);
			var numCM = 0, numTD = 0, numTP = 0, num;
			for (var j=0;j<dataObj["courses"][i]["slots"].length;j++) {
				var slot = dataObj["courses"][i]["slots"][j];
				switch (slot.type) { // Mise en forme des données
					case 'CM': var type='C'; numCM++; num=numCM; break;
					case 'TD': var type='D'; numTD++; num=numTD; break;
					case 'TP': var type='P'; numTP++; num=numTP; break;
					default: var type='?'; num=0; break;
				}
				if (type!='?') { // Évite les potentielles erreurs
					// Ajout d'un nouveau créneau pour ce cours
					fs.appendFileSync(filePath,`1,${type}${num},P=${slot.max},H=${daysShort[slot.day]} ${slot.startHour}-${slot.endHour},F1,${slot.room}//\r\n`);
				}
			// Attention perte du pieds de page
			}
		}

		
	}
	console.log("File updated successfully\n".green);
	main();
}

// Autres fonctions

/**
 * Fonction pour nettoyer la console et informer l'utilisateur sur son choix
 * @param indexOption Option sélectionnée par l'utilisateur dans main()
*/
function newTab(indexOption) { 
	console.clear();
	console.log('\nMenu principal > ' + options[indexOption-1] + '\n');
}

/////////// /////////// CODE AU LANCEMENT /////////// ///////////

console.clear();
console.log("\n           .--.                   .---.\n       .---|__|           .-.     |~~~|\n    .--|===|--|_          |_|     |~~~|--.\n    |  |===|  |'\\     .---!~|  .--|   |--|\n    |%%|   |  |.'\\    |===| |--|%%|   |  |\n    |%%|   |  |\\.'\\   |   | |__|  |   |  |\n    |  |   |  | \\  \\  |===| |==|  |   |  |\n    |  |   |__|  \\.'\\ |   |_|__|  |~~~|__|\n    |  |===|--|   \\.'\\|===|~|--|%%|~~~|--|\n    ^--^---'--^    `-'`---^-^--^--^---'--'\n");

main();

module.exports = 'index.js';
