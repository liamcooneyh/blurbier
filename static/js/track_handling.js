function loadTracks() {
    const selectedPlaylists = $('#playlist-select').val();
    if (selectedPlaylists.length > 0) {
        resetTable();
        fetch(`/playlist-tracks?playlist_ids=${selectedPlaylists.join('&playlist_ids=')}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = $('#tracks tbody');
                tableBody.empty();
                data.forEach(track => {
                    const danceability = track.audio_features.danceability;
                    const tempo = track.audio_features.tempo;
                    const valence = track.audio_features.valence;
                    const energy = track.audio_features.energy;
                    const key = track.audio_features.key;
                    const mode = track.audio_features.mode;
                    const time_signature = track.audio_features.time_signature;

                    if (isTrackMatchingFilters(danceability, tempo, valence, energy)) {
                        const trackData = {
                            name: track.name,
                            artists: track.artists.map(artist => artist.name),
                            album: track.album.name,
                            duration: track.duration_ms,
                            audio_features: track.audio_features,
                            uri: track.uri,
                            key: getKeyMapping(key),
                            mode: getModeMapping(mode),
                            time_signature: time_signature
                        };

                        const row = `
                            <tr data-track="${encodeURIComponent(JSON.stringify(trackData))}">
                                <td>${track.name}</td>
                                <td>${track.artists.map(artist => artist.name).join(', ')}</td>
                                <td>${track.album.name}</td>
                                <td>${(track.duration_ms / 60000).toFixed(2)} mins</td>
                                <td>${danceability}</td>
                                <td>${energy}</td>
                                <td>${valence}</td>
                                <td>${tempo}</td>
                                <td>${getKeyMapping(key)}</td>
                                <td>${getModeMapping(mode)}</td>
                                <td>${time_signature}</td>
                            </tr>
                        `;
                        tableBody.append(row);
                    }
                });

                if (!$.fn.DataTable.isDataTable('#tracks')) {
                    $('#tracks').DataTable({
                        scrollY: '300px',
                        scrollCollapse: true,
                        paging: false,
                        lengthMenu: [50]
                    });
                } else {
                    $('#tracks').DataTable().clear().draw();
                    $('#tracks').DataTable().rows.add($(tableBody).children()).draw();
                }
            })
            .catch(error => {
                console.error('Error fetching tracks:', error);
                alert(`Error fetching tracks: ${error.message || error}`);
            });
    } else {
        resetTable();
    }
}

function isTrackMatchingFilters(danceability, tempo, valence, energy) {
    const danceabilityRange = document.getElementById('danceability-slider').noUiSlider.get();
    const tempoRange = document.getElementById('tempo-slider').noUiSlider.get();
    const moodRange = document.getElementById('mood-slider').noUiSlider.get();
    const energyRange = document.getElementById('energy-slider').noUiSlider.get();

    return (danceability >= parseFloat(danceabilityRange[0]) && danceability <= parseFloat(danceabilityRange[1])) &&
           (tempo >= parseFloat(tempoRange[0]) && tempo <= parseFloat(tempoRange[1])) &&
           (valence >= parseFloat(moodRange[0]) && valence <= parseFloat(moodRange[1])) &&
           (energy >= parseFloat(energyRange[0]) && energy <= parseFloat(energyRange[1]));
}

function resetTable() {
    const tableBody = $('#tracks tbody');
    tableBody.empty();
    if ($.fn.DataTable.isDataTable('#tracks')) {
        $('#tracks').DataTable().clear().destroy();
    }
}
