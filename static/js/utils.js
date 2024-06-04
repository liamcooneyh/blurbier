function getKeyMapping(key) {
    const keyMappings = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
    return keyMappings[key] || 'Unknown';
}

function getModeMapping(mode) {
    return mode === 1 ? 'Major' : 'Minor';
}
