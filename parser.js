const fs = require('fs');

function parseFile(filePath) {
    const file = fs.readFileSync(filePath, 'utf-8');
    const listCourses = {};
    const lines = file.split('\n');

    let currentCourse = null;

    lines.forEach(line => {
        if (line.startsWith('+')) {
            currentCourse = line.slice(1).trim();
            listCourses[currentCourse] = [];
        } else if (line.trim() && currentCourse) {
            const parts = line.split(',');
            if (parts.length >= 6 && line.includes('H=') && line.includes('S=')) { 
                const [index, type, capacity, timing, group, room] = parts;
                listCourses[currentCourse].push({
                    index: parseInt(index),
                    type: type.trim(),
                    capacity: parseInt(capacity.split('=')[1]),
                    time: timing.split('=')[1].trim(),
                    group: group.trim(),
                    room: room.split('=')[1].trim().replace('//', ''),
                });
            }
        }
    });

    return listCourses;
}

module.exports = { parseFile };

