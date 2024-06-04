document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('curve-select').addEventListener('change', function() {
        const selectedCurve = this.value;
        const tracksParam = localStorage.getItem('selectedTracks');
        
        let data;
        try {
            data = { tracks: JSON.parse(tracksParam) };
        } catch (e) {
            console.error('Error parsing tracks:', e);
            return;
        }

        const totalTime = data.tracks.reduce((sum, track) => sum + track.duration, 0);

        let curveData = [];
        if (selectedCurve === 'smooth_ascend') {
            curveData = generateSmoothAscendCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'energetic_peaks') {
            curveData = generateEnergeticPeaksCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'evening_chill') {
            curveData = generateEveningChillCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'dynamic_rollercoaster') {
            curveData = generateDynamicRollercoasterCurve(totalTime, data.tracks.length);
        } else if (selectedCurve === 'mellow_vibes') {
            curveData = generateMellowVibesCurve(totalTime, data.tracks.length);
        }

        console.log('Generated Curve Data:', curveData);  // Debugging output

        arrangeTracksByCurve(curveData, selectedCurve);
    });

    function arrangeTracksByCurve(curveData, selectedCurve) {
        const tracksParam = localStorage.getItem('selectedTracks');
        
        let data;
        try {
            data = { tracks: JSON.parse(tracksParam) };
        } catch (e) {
            console.error('Error parsing tracks:', e);
            return;
        }

        const tracks = [...data.tracks];
        const metrics = tracks.map(track => {
            const audioFeatures = track.audio_features || {};
            return {
                energy: audioFeatures.energy || 0,
                valence: audioFeatures.valence || 0,
                tempo: audioFeatures.tempo || 0,
                danceability: audioFeatures.danceability || 0,
                key: audioFeatures.key || 0,
                mode: audioFeatures.mode || 0,
                time_signature: audioFeatures.time_signature || 0
            };
        });

        const filteredTracks = filterTracksByCurve(tracks, metrics, selectedCurve);
        const filteredMetrics = metrics.filter((_, index) => filteredTracks.includes(tracks[index]));

        const sortedIndices = getSortedIndicesByCurve(filteredMetrics, curveData);
        const sortedTracks = sortedIndices.map(index => filteredTracks[index]);

        const tbody = document.querySelector('#track-list tbody');
        tbody.innerHTML = '';
        sortedTracks.forEach(track => {
            const row = document.createElement('tr');
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

        updateChart(sortedTracks);
    }

    function filterTracksByCurve(tracks, metrics, selectedCurve) {
        const thresholds = getCurveThresholds(selectedCurve);
        return tracks.filter((track, index) => {
            const metric = metrics[index];
            return (
                metric.energy >= thresholds.energy.min && metric.energy <= thresholds.energy.max &&
                metric.valence >= thresholds.valence.min && metric.valence <= thresholds.valence.max &&
                metric.tempo >= thresholds.tempo.min && metric.tempo <= thresholds.tempo.max &&
                metric.danceability >= thresholds.danceability.min && metric.danceability <= thresholds.danceability.max
            );
        });
    }

    function getCurveThresholds(selectedCurve) {
        switch (selectedCurve) {
            case 'smooth_ascend':
                return {
                    energy: { min: 0.2, max: 0.8 },
                    valence: { min: 0.2, max: 0.8 },
                    tempo: { min: 80, max: 120 },
                    danceability: { min: 0.2, max: 0.8 }
                };
            case 'energetic_peaks':
                return {
                    energy: { min: 0.0, max: 1.0 }, // Allow all energy levels for peaks
                    valence: { min: 0.0, max: 1.0 },
                    tempo: { min: 0.0, max: 1.0 },
                    danceability: { min: 0.0, max: 1.0 }
                };
            case 'evening_chill':
                return {
                    energy: { min: 0.1, max: 0.5 },
                    valence: { min: 0.1, max: 0.5 },
                    tempo: { min: 60, max: 100 },
                    danceability: { min: 0.1, max: 0.5 }
                };
            case 'dynamic_rollercoaster':
                return {
                    energy: { min: 0.0, max: 1.0 }, // Allow all energy levels for dynamic changes
                    valence: { min: 0.0, max: 1.0 },
                    tempo: { min: 0.0, max: 1.0 },
                    danceability: { min: 0.0, max: 1.0 }
                };
            case 'mellow_vibes':
                return {
                    energy: { min: 0.3, max: 0.6 },
                    valence: { min: 0.3, max: 0.6 },
                    tempo: { min: 70, max: 110 },
                    danceability: { min: 0.3, max: 0.6 }
                };
            default:
                return {
                    energy: { min: 0.0, max: 1.0 },
                    valence: { min: 0.0, max: 1.0 },
                    tempo: { min: 0.0, max: 1.0 },
                    danceability: { min: 0.0, max: 1.0 }
                };
        }
    }

    function getSortedIndicesByCurve(metrics, curveData) {
        return metrics.map((metric, index) => ({
            index,
            score: Math.abs(metric.energy - curveData[index].energy) +
                   Math.abs(metric.valence - curveData[index].valence) +
                   Math.abs(metric.tempo - curveData[index].tempo) +
                   harmonicCompatibility(metric.key, metric.mode, curveData[index].key, curveData[index].mode)
        }))
        .sort((a, b) => a.score - b.score)
        .map(item => item.index);
    }

    function harmonicCompatibility(key1, mode1, key2, mode2) {
        const distance = Math.min(
            Math.abs(key1 - key2),
            12 - Math.abs(key1 - key2)
        );
        const modeBonus = mode1 === mode2 ? 0 : 1;
        return distance + modeBonus;
    }
});
