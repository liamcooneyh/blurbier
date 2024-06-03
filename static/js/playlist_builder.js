document.addEventListener('DOMContentLoaded', function() {
    $('.select2-multiple').select2();

    const danceabilitySlider = document.getElementById('danceability-slider');
    const tempoSlider = document.getElementById('tempo-slider');
    const moodSlider = document.getElementById('mood-slider');
    const energySlider = document.getElementById('energy-slider');

    noUiSlider.create(danceabilitySlider, {
        start: [0, 1],
        connect: true,
        range: {
            'min': 0,
            'max': 1
        },
        step: 0.01,
        tooltips: [true, true]
    });

    noUiSlider.create(tempoSlider, {
        start: [60, 180],
        connect: true,
        range: {
            'min': 60,
            'max': 180
        },
        step: 1,
        tooltips: [true, true]
    });

    noUiSlider.create(moodSlider, {
        start: [0, 1],
        connect: true,
        range: {
            'min': 0,
            'max': 1
        },
        step: 0.01,
        tooltips: [true, true]
    });

    noUiSlider.create(energySlider, {
        start: [0, 1],
        connect: true,
        range: {
            'min': 0,
            'max': 1
        },
        step: 0.01,
        tooltips: [true, true]
    });

    $('#playlist-select, #danceability-slider, #tempo-slider, #mood-slider, #energy-slider').on('change', function() {
        loadTracks();
    });

    danceabilitySlider.noUiSlider.on('change', function() {
        loadTracks();
    });

    tempoSlider.noUiSlider.on('change', function() {
        loadTracks();
    });

    moodSlider.noUiSlider.on('change', function() {
        loadTracks();
    });

    energySlider.noUiSlider.on('change', function() {
        loadTracks();
    });

    function loadTracks() {
        const selectedPlaylists = $('#playlist-select').val();
        if (selectedPlaylists.length > 0) {
            resetTable();
            fetch(`/playlist-tracks?playlist_ids=${selectedPlaylists.join('&playlist_ids=')}`)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(error => { throw new Error(error.error); });
                    }
                    return response.json();
                })
                .then(data => {
                    const tableBody = $('#tracks tbody');
                    tableBody.empty();
                    data.forEach(track => {
                        const danceability = track.audio_features.danceability;
                        const tempo = track.audio_features.tempo;
                        const valence = track.audio_features.valence;
                        const energy = track.audio_features.energy;

                        if (isTrackMatchingFilters(danceability, tempo, valence, energy)) {
                            const trackData = {
                                name: track.name,
                                artists: track.artists.map(artist => artist.name),
                                album: track.album.name,
                                duration: track.duration_ms,
                                audio_features: track.audio_features,
                                uri: track.uri  // Ensure URI is included
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
        const danceabilityRange = danceabilitySlider.noUiSlider.get();
        const tempoRange = tempoSlider.noUiSlider.get();
        const moodRange = moodSlider.noUiSlider.get();
        const energyRange = energySlider.noUiSlider.get();

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

    $('#create-playlist').click(function() {
        const selectedTracks = [];
        $('#tracks tbody tr').each(function() {
            const trackData = decodeURIComponent($(this).attr('data-track'));
            console.log('Track data:', trackData);  // Debugging output
            const track = JSON.parse(trackData);
            selectedTracks.push(track);
        });

        console.log('Selected Tracks:', selectedTracks);  // Debugging output

        // Save selected tracks to local storage
        localStorage.setItem('selectedTracks', JSON.stringify(selectedTracks));
        window.location.href = '/playlist_creator';
    });

    $('#reset').click(function() {
        $('#playlist-select').val(null).trigger('change');
        danceabilitySlider.noUiSlider.reset();
        tempoSlider.noUiSlider.reset();
        moodSlider.noUiSlider.reset();
        energySlider.noUiSlider.reset();
        resetTable();
    });

    // Clear selections on page load or refresh
    $('#playlist-select').val(null).trigger('change');
    danceabilitySlider.noUiSlider.reset();
    tempoSlider.noUiSlider.reset();
    moodSlider.noUiSlider.reset();
    energySlider.noUiSlider.reset();
    resetTable();
});
