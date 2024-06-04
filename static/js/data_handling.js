document.addEventListener('DOMContentLoaded', function() {
    const trackList = document.getElementById('track-list');

    // Retrieve selected tracks from local storage
    const tracksParam = localStorage.getItem('selectedTracks');
    
    let data;
    try {
        data = { tracks: JSON.parse(tracksParam) };
    } catch (e) {
        console.error('Error parsing tracks:', e);
        return;
    }

    console.log('Parsed Tracks Data:', data.tracks);  // Debugging output

    if (data.tracks) {
        const table = document.createElement('table');
        table.id = "track-list-table";
        table.classList.add("display");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Artists</th>
                    <th>Album</th>
                    <th>Duration (mins)</th>
                    <th>Danceability</th>
                    <th>Energy</th>
                    <th>Valence</th>
                    <th>Tempo</th>
                    <th>Key</th>
                    <th>Mode</th>
                    <th>Time Signature</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        trackList.appendChild(table);

        const tbody = table.querySelector('tbody');
        
        // Sort tracks optimally
        const sortedTracks = data.tracks.sort((a, b) => {
            return a.audio_features.key - b.audio_features.key ||
                   a.audio_features.mode - b.audio_features.mode ||
                   a.audio_features.time_signature - b.audio_features.time_signature ||
                   a.audio_features.energy - b.audio_features.energy ||
                   a.audio_features.valence - b.audio_features.valence;
        });

        sortedTracks.forEach(track => {
            const row = document.createElement('tr');
            row.dataset.track = encodeURIComponent(JSON.stringify(track)); // Add dataset attribute for later use
            row.innerHTML = `
                <td>${track.name}</td>
                <td>${track.artists.join(', ')}</td>
                <td>${track.album}</td>
                <td>${(track.duration / 60000).toFixed(2)}</td>
                <td>${track.audio_features.danceability}</td>
                <td>${track.audio_features.energy}</td>
                <td>${track.audio_features.valence}</td>
                <td>${track.audio_features.tempo}</td>
                <td>${getKeyMapping(track.audio_features.key)}</td>
                <td>${getModeMapping(track.audio_features.mode)}</td>
                <td>${track.audio_features.time_signature}</td>
            `;
            tbody.appendChild(row);
        });

        // Initialize DataTable with scrollable body
        $(document).ready(function() {
            $('#track-list-table').DataTable({
                scrollY: '420px',
                scrollCollapse: true,
                paging: false,
                searching: false,
                info: true,
                columnDefs: [
                    { targets: '_all', className: 'dt-left' }
                ]
            });
        });
    }

    // Data handling functions
    function getKeyMapping(key) {
        const keyMappings = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
        return keyMappings[key] || 'Unknown';
    }

    function getModeMapping(mode) {
        return mode === 1 ? 'Major' : 'Minor';
    }
});
