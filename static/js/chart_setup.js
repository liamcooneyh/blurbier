document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('curveChart').getContext('2d');
    window.curveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Energy', data: [], borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Valence', data: [], borderColor: 'rgba(192, 75, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Tempo', data: [], borderColor: 'rgba(192, 192, 75, 1)', borderWidth: 1, fill: false },
                { label: 'Danceability', data: [], borderColor: 'rgba(75, 75, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Key', data: [], borderColor: 'rgba(192, 192, 192, 1)', borderWidth: 1, fill: false },
                { label: 'Mode', data: [], borderColor: 'rgba(75, 192, 75, 1)', borderWidth: 1, fill: false }
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

    function updateChart(tracks) {
        const energyData = tracks.map(track => track.audio_features ? track.audio_features.energy : 0);
        const valenceData = tracks.map(track => track.audio_features ? track.audio_features.valence : 0);
        const tempoData = tracks.map(track => track.audio_features ? track.audio_features.tempo : 0);
        const danceabilityData = tracks.map(track => track.audio_features ? track.audio_features.danceability : 0);
        const keyData = tracks.map(track => track.audio_features ? track.audio_features.key / 12 : 0);
        const modeData = tracks.map(track => track.audio_features ? track.audio_features.mode : 0);

        window.curveChart.data.labels = tracks.map((_, index) => index);
        window.curveChart.data.datasets[0].data = energyData;
        window.curveChart.data.datasets[1].data = valenceData;
        window.curveChart.data.datasets[2].data = tempoData;
        window.curveChart.data.datasets[3].data = danceabilityData;
        window.curveChart.data.datasets[4].data = keyData;
        window.curveChart.data.datasets[5].data = modeData;
        window.curveChart.update();
    }

    window.updateChart = updateChart; // Expose function globally for use in other scripts
});
