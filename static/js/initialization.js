document.addEventListener('DOMContentLoaded', function() {
    const playlistSelect = $('#playlist-select');

    // Initialize select2 with correct width
    playlistSelect.select2({
        placeholder: "Select Playlists",
        width: '100%'
    });

    // Fetch playlists from the backend
    fetch('/playlists')
        .then(response => response.json())
        .then(playlists => {
            console.log('Playlists fetched:', playlists); // Log the playlists
            playlists.forEach(playlist => {
                const option = new Option(playlist.name, playlist.id, false, false);
                playlistSelect.append(option);
            });
            playlistSelect.trigger('change');
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
        });

    const danceabilitySlider = document.getElementById('danceability-slider');
    const tempoSlider = document.getElementById('tempo-slider');
    const moodSlider = document.getElementById('mood-slider');
    const energySlider = document.getElementById('energy-slider');

    // Create noUiSliders with value display
    function createSlider(slider, minElem, maxElem, start, range, step) {
        noUiSlider.create(slider, {
            start: start,
            connect: true,
            range: range,
            step: step,
            tooltips: [false, false]
        });
        slider.noUiSlider.on('update', function(values) {
            minElem.textContent = values[0];
            maxElem.textContent = values[1];
        });
    }

    createSlider(danceabilitySlider, 
                 document.getElementById('danceability-min'), 
                 document.getElementById('danceability-max'), 
                 [0, 1], 
                 { min: 0, max: 1 }, 
                 0.01);
    
    createSlider(tempoSlider, 
                 document.getElementById('tempo-min'), 
                 document.getElementById('tempo-max'), 
                 [60, 180], 
                 { min: 60, max: 180 }, 
                 1);
    
    createSlider(moodSlider, 
                 document.getElementById('mood-min'), 
                 document.getElementById('mood-max'), 
                 [0, 1], 
                 { min: 0, max: 1 }, 
                 0.01);
    
    createSlider(energySlider, 
                 document.getElementById('energy-min'), 
                 document.getElementById('energy-max'), 
                 [0, 1], 
                 { min: 0, max: 1 }, 
                 0.01);

        function loadTracks() {
        const selectedPlaylists = $('#playlist-select').val();
        if (selectedPlaylists.length > 0) {
            resetTable();
            fetch(`/playlist-tracks?playlist_ids=${selectedPlaylists.join('&playlist_ids=')}`)
                .then(response => response.json())
                .then(data => {
                    const tableBody = $('#tracks tbody');
                    tableBody.empty();
                    
                    // Get the current slider values
                    const danceabilityRange = danceabilitySlider.noUiSlider.get();
                    const tempoRange = tempoSlider.noUiSlider.get();
                    const moodRange = moodSlider.noUiSlider.get();
                    const energyRange = energySlider.noUiSlider.get();
    
                    data.forEach(track => {
                        const danceability = track.audio_features.danceability;
                        const tempo = track.audio_features.tempo;
                        const valence = track.audio_features.valence;
                        const energy = track.audio_features.energy;
    
                        // Filter tracks based on slider values
                        if (danceability >= danceabilityRange[0] && danceability <= danceabilityRange[1] &&
                            tempo >= tempoRange[0] && tempo <= tempoRange[1] &&
                            valence >= moodRange[0] && valence <= moodRange[1] &&
                            energy >= energyRange[0] && energy <= energyRange[1]) {
                            
                            const key = track.audio_features.key;
                            const mode = track.audio_features.mode;
                            const time_signature = track.audio_features.time_signature;
    
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
                

    function resetTable() {
        const tableBody = $('#tracks tbody');
        tableBody.empty();
        if ($.fn.DataTable.isDataTable('#tracks')) {
            $('#tracks').DataTable().clear().destroy();
        }
    }

    // Attach event listeners to sliders to load tracks on change
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

    // Attach event listeners to buttons
    $('#create-playlist').click(function() {
        const selectedTracks = [];
        $('#tracks tbody tr').each(function() {
            const trackData = decodeURIComponent($(this).attr('data-track'));
            const track = JSON.parse(trackData);
            selectedTracks.push(track);
        });

        localStorage.setItem('selectedTracks', JSON.stringify(selectedTracks));
        window.location.href = '/playlist_creator';
    });

    $('#reset').click(function() {
        playlistSelect.val(null).trigger('change');
        danceabilitySlider.noUiSlider.reset();
        tempoSlider.noUiSlider.reset();
        moodSlider.noUiSlider.reset();
        energySlider.noUiSlider.reset();
        resetTable();
    });

    playlistSelect.on('change', function() {
        loadTracks();
    });

    // Initialize the page with default settings
    playlistSelect.val(null).trigger('change');
    danceabilitySlider.noUiSlider.reset();
    tempoSlider.noUiSlider.reset();
    moodSlider.noUiSlider.reset();
    energySlider.noUiSlider.reset();
    loadTracks(); // Load tracks initially
});
