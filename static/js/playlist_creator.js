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
        data.tracks.forEach(track => {
            const li = document.createElement('li');
            li.textContent = `${track.name} by ${track.artists.join(', ')} from the album ${track.album}`;
            li.dataset.track = encodeURIComponent(JSON.stringify(track));
            trackList.appendChild(li);
        });
    }

    const ctx = document.getElementById('curveChart').getContext('2d');
    const curveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Energy', data: [], borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Valence', data: [], borderColor: 'rgba(192, 75, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Tempo', data: [], borderColor: 'rgba(192, 192, 75, 1)', borderWidth: 1, fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { type: 'linear', position: 'bottom' },
                y: { beginAtZero: true, max: 1 }
            }
        }
    });

    document.getElementById('curve-select').addEventListener('change', function() {
        const selectedCurve = this.value;
        const totalTime = data.tracks.reduce((sum, track) => sum + track.duration, 0);

        let curveData = [];
        if (selectedCurve === 'get_party_going') {
            curveData = generateGetPartyGoingCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'dark_to_light') {
            curveData = generateDarkToLightCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'high_energy_peaks') {
            curveData = generateHighEnergyPeaksCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'relaxed_evening') {
            curveData = generateRelaxedEveningCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'build_up_release') {
            curveData = generateBuildUpReleaseCurve(totalTime, data.tracks.length);
        }

        arrangeTracksByCurve(curveData);
    });

    document.getElementById('create-playlist').addEventListener('click', function() {
        const orderedTracks = [];
        document.querySelectorAll('#track-list li').forEach(li => {
            const track = JSON.parse(decodeURIComponent(li.dataset.track));
            if (track.audio_features.uri) {
                orderedTracks.push(track);
            } else {
                console.error('Track missing URI:', track);
            }
        });

        console.log('Ordered Tracks:', orderedTracks); // Debugging output

        fetch('/create_playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: orderedTracks })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Playlist created successfully!');
            } else {
                alert('Failed to create playlist.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create playlist.');
        });
    });

    function arrangeTracksByCurve(curveData) {
        const tracks = [...data.tracks];
        const metrics = tracks.map(track => {
            const audioFeatures = track.audio_features || {};
            return {
                energy: audioFeatures.energy || 0,
                valence: audioFeatures.valence || 0,
                tempo: audioFeatures.tempo || 0
            };
        });

        const sortedIndices = getSortedIndicesByCurve(metrics, curveData);
        const sortedTracks = sortedIndices.map(index => tracks[index]);

        trackList.innerHTML = '';
        sortedTracks.forEach(track => {
            const li = document.createElement('li');
            li.textContent = `${track.name} by ${track.artists.join(', ')} from the album ${track.album}`;
            li.dataset.track = encodeURIComponent(JSON.stringify(track));
            trackList.appendChild(li);
        });

        updateChart(sortedTracks);
    }

    function getSortedIndicesByCurve(metrics, curveData) {
        return metrics.map((metric, index) => ({
            index,
            score: Math.abs(metric.energy - curveData[index].energy) +
                   Math.abs(metric.valence - curveData[index].valence) +
                   Math.abs(metric.tempo - curveData[index].tempo)
        }))
        .sort((a, b) => a.score - b.score)
        .map(item => item.index);
    }

    function updateChart(tracks) {
        const energyData = tracks.map(track => track.audio_features ? track.audio_features.energy : 0);
        const valenceData = tracks.map(track => track.audio_features ? track.audio_features.valence : 0);
        const tempoData = tracks.map(track => track.audio_features ? track.audio_features.tempo : 0);

        curveChart.data.labels = tracks.map((_, index) => index);
        curveChart.data.datasets[0].data = energyData;
        curveChart.data.datasets[1].data = valenceData;
        curveChart.data.datasets[2].data = tempoData;
        curveChart.update();
    }

    function generateGetPartyGoingCurve(totalTime, trackCount) {
        const curve = [];
        for (let i = 0; i < trackCount; i++) {
            curve.push({ energy: i / trackCount, valence: 0.5, tempo: 0.5 });
        }
        return curve;
    }

    function generateDarkToLightCurve(totalTime, trackCount) {
        const curve = [];
        for (let i = 0; i < trackCount; i++) {
            curve.push({ energy: 0.5, valence: i / trackCount, tempo: 0.5 });
        }
        return curve;
    }

    function generateHighEnergyPeaksCurve(totalTime, trackCount) {
        const curve = [];
        for (let i = 0; i < trackCount; i++) {
            curve.push({ energy: Math.sin(i / trackCount * Math.PI * 4) * 0.5 + 0.5, valence: 0.5, tempo: 0.5 });
        }
        return curve;
    }

    function generateRelaxedEveningCurve(totalTime, trackCount) {
        const curve = [];
        for (let i = 0; i < trackCount; i++) {
            curve.push({ energy: 0.5, valence: 0.5, tempo: 1 - i / trackCount });
        }
        return curve;
    }

    function generateBuildUpReleaseCurve(totalTime, trackCount) {
        const curve = [];
        for (let i = 0; i < trackCount; i++) {
            curve.push({ energy: (i % 2 === 0) ? 1 : 0.5, valence: 0.5, tempo: (i % 2 === 0) ? 1 : 0.5 });
        }
        return curve;
    }

    document.getElementById('back-to-builder').addEventListener('click', function() {
        window.location.href = '/playlist_builder';
    });

    new Sortable(trackList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onSort: function() {
            updateChart();
        }
    });
});
