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
                    <th>Flow Rating</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        trackList.appendChild(table);

        const tbody = table.querySelector('tbody');

        // Sort tracks optimally and calculate flow ratings
        const sortedTracks = dynamicSort(data.tracks);
        let totalFlowRating = 0;
        let flowRatingsCount = 0;

        sortedTracks.forEach((track, index) => {
            const flowRating = index === 0 ? 10 : calculateFlowRating(sortedTracks[index - 1], track);
            totalFlowRating += flowRating;
            flowRatingsCount += 1;

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
                <td>${flowRating.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });

        // Calculate and display average flow rating
        const averageFlowRating = totalFlowRating / flowRatingsCount;
        document.getElementById('playlist-score').innerText = averageFlowRating.toFixed(2);

        // Initialize DataTable with scrollable body and disable sorting
        $(document).ready(function() {
            $('#track-list-table').DataTable({
                scrollY: '420px',
                scrollCollapse: true,
                paging: false,
                searching: false,
                info: true,
                ordering: false, // Disable ordering
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

    function dynamicSort(tracks) {
        // Group by key and mode
        const groupedTracks = {};
        tracks.forEach(track => {
            const keyMode = `${track.audio_features.key}-${track.audio_features.mode}`;
            if (!groupedTracks[keyMode]) {
                groupedTracks[keyMode] = [];
            }
            groupedTracks[keyMode].push(track);
        });

        // Sort within each group by tempo and energy
        for (const keyMode in groupedTracks) {
            groupedTracks[keyMode].sort((a, b) => {
                return a.audio_features.tempo - b.audio_features.tempo ||
                       a.audio_features.energy - b.audio_features.energy;
            });
        }

        // Combine all groups back into a single array
        let sortedTracks = [];
        for (const keyMode in groupedTracks) {
            sortedTracks = sortedTracks.concat(groupedTracks[keyMode]);
        }

        return sortedTracks;
    }

    function calculateFlowRating(track1, track2) {
        const keyDifference = Math.abs(track1.audio_features.key - track2.audio_features.key);
        const modeDifference = track1.audio_features.mode === track2.audio_features.mode ? 0 : 1;
        const tempoDifference = Math.abs(track1.audio_features.tempo - track2.audio_features.tempo);
        const energyDifference = Math.abs(track1.audio_features.energy - track2.audio_features.energy);

        // Calculate a flow rating based on the differences, scaled to 1-10
        const flowRating = 10 - (keyDifference + modeDifference + (tempoDifference / 10) + (energyDifference * 10));
        return Math.max(flowRating, 1); // Ensure the minimum rating is 1
    }
});
