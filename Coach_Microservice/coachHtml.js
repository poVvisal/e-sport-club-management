function generateCoachHTML(title, message, data) {
    let dataHtml = '';

    if (Array.isArray(data)) {
        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Name</th>
                        <th style="width: 35%;">Email</th>
                        <th style="width: 20%;">Mobile</th>
                        <th style="width: 20%;">Role</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(player => `
                        <tr>
                            <td>${player.name}</td>
                            <td>${player.emailid}</td>
                            <td>${player.mobile}</td>
                            <td>${player.role}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (data) {
        const dataObject = data.toObject ? data.toObject() : data;
        dataHtml = '<div class="data-list">';
        for (let [key, value] of Object.entries(dataObject)) {
            if (key !== '__v' && key !== '_id') {
                if (key === 'matchDate') {
                    value = new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }).format(new Date(value));
                }
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                dataHtml += `<p><span class="label">${formattedKey}:</span> ${value}</p>`;
            }
        }
        dataHtml += '</div>';
    }

    return `
    <html>
    <head>
        <title>Coach Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #111827;
                --surface: #1F2937;
                --primary: #38BDF8;
                --text-primary: #E5E7EB;
                --text-secondary: #9CA3AF;
                --surface-darker: #374151;
            }
            body {
                font-family: 'IBM Plex Sans', sans-serif;
                background: var(--background);
                color: var(--text-primary);
                padding: 40px;
                margin: 0;
            }
            .container {
                background: var(--surface);
                border: 2px solid var(--primary);
                border-radius: 16px;
                max-width: 800px;
                margin: auto;
                padding: 40px;
                box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
            }
            h1 {
                font-family: 'Exo 2', sans-serif;
                color: var(--primary);
                font-size: 2.5em;
                margin: 0 0 10px 0;
                text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .coach-msg {
                font-family: 'Caveat', cursive;
                font-size: 1.7em;
                color: var(--text-secondary);
                margin-bottom: 25px;
                border-left: 3px solid var(--primary);
                padding-left: 15px;
            }
            .data-list p { background: var(--surface-darker); padding: 12px; border-left: 4px solid var(--primary); border-radius: 4px; margin: 10px 0; }
            .data-list .label { font-weight: 500; color: var(--text-primary); }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                table-layout: fixed;
            }
            .data-table th, .data-table td {
                padding: 16px;
                text-align: left;
                border-bottom: 1px solid var(--surface-darker);
                vertical-align: middle;
                overflow-wrap: break-word;
            }
            .data-table th {
                background-color: var(--primary);
                color: #111827;
                font-weight: 500;
            }
            .data-table tbody tr:nth-child(even) { background-color: var(--surface); }
            .data-table tbody tr:hover { background-color: var(--surface-darker); transition: background-color 0.2s ease-in-out; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="coach-msg">${message}</p>
            ${dataHtml}
        </div>
    </body>
    </html>`;
}

function generateScheduleTableHTML(title, message, schedules) {
    let dataHtml = '';

    if (Array.isArray(schedules) && schedules.length > 0) {
        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Match ID</th>
                        <th>Opponent</th>
                        <th>Game</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedules.map(sch => `
                        <tr>
                            <td>${sch.matchId}</td>
                            <td>${sch.opponent}</td>
                            <td>${sch.game}</td>
                            <td>${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(sch.matchDate))}</td>
                            <td>${sch.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        dataHtml = '<p>No scheduled matches found.</p>';
    }

    return `
    <html>
    <head>
        <title>Coach Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #111827;
                --surface: #1F2937;
                --primary: #38BDF8;
                --text-primary: #E5E7EB;
                --text-secondary: #9CA3AF;
                --surface-darker: #374151;
            }
            body {
                font-family: 'IBM Plex Sans', sans-serif;
                background: var(--background);
                color: var(--text-primary);
                padding: 40px;
                margin: 0;
            }
            .container {
                background: var(--surface);
                border: 2px solid var(--primary);
                border-radius: 16px;
                max-width: 800px;
                margin: auto;
                padding: 40px;
                box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
            }
            h1 {
                font-family: 'Exo 2', sans-serif;
                color: var(--primary);
                font-size: 2.5em;
                margin: 0 0 10px 0;
                text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .coach-msg {
                font-family: 'Caveat', cursive;
                font-size: 1.7em;
                color: var(--text-secondary);
                margin-bottom: 25px;
                border-left: 3px solid var(--primary);
                padding-left: 15px;
            }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                table-layout: fixed;
            }
            .data-table th, .data-table td {
                padding: 16px;
                text-align: left;
                border-bottom: 1px solid var(--surface-darker);
                vertical-align: middle;
                overflow-wrap: break-word;
            }
            .data-table th {
                background-color: var(--primary);
                color: #111827;
                font-weight: 500;
            }
            .data-table tbody tr:nth-child(even) { background-color: var(--surface); }
            .data-table tbody tr:hover { background-color: var(--surface-darker); transition: background-color 0.2s ease-in-out; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="coach-msg">${message}</p>
            ${dataHtml}
        </div>
    </body>
    </html>`;
}

module.exports = {
    generateCoachHTML,
    generateScheduleTableHTML
};