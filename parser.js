const fs = require('fs');

function parseFile(filePath) {
    const file = fs.readFileSync(filePath, 'utf-8');
    const courses = [];
    const lines = file.split('\n');

    let currentCourse = null;

    lines.forEach(line => {
        if (line.startsWith('+')) {
            // Mise à jour du cours actuel (ex : +AP03)
            currentCourse = line.slice(1).trim();
        } else if (line.trim() && currentCourse) {
            // Parse des détails de session (ex : 1,D1,P=25,H=V 9:00-12:00,F1,S=B103)
            const parts = line.split(',');
            if (parts.length >= 6 && line.includes('H=') && line.includes('S=')) { 
                const [index, type, capacity, timing, group, room] = parts;
                courses.push({
                    courseId: currentCourse, // Ajout de l'ID du cours
                    index: parseInt(index),
                    type: type.trim(),
                    capacity: parseInt(capacity.split('=')[1]),
                    time: timing.split('=')[1].trim(),
                    group: group.trim(),
                    room: room.split('=')[1].split('/')[0].trim().replace('//', ''),
                });
            }
        }
    });

    return courses;
}

module.exports = { parseFile };
