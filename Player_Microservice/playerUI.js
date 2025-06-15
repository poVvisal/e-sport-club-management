// Generates the main UI for the player
function generatePlayerHTML(title, message, data = []) {
    let dataHtml = '';

    // Check if there's data and if it's an array with items
    if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]).filter(key => !['_id', '__v', 'isReviewed', 'reviewNotes'].includes(key));
        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${headers.map(header => {
                                let value = item[header];
                                if (header === 'matchDate') {
                                    value = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
                                }
                                return `<td>${value}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (!Array.isArray(data) && data) { // For single objects like a submitted review
         const dataObject = data.toObject ? data.toObject() : data;
         dataHtml = '<div class="data-list">';
         for (const [key, value] of Object.entries(dataObject)) {
             if (key !== '__v' && key !== '_id') {
                 const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                 dataHtml += `<p><span class="label">${formattedKey}:</span> ${value}</p>`;
             }
         }
         dataHtml += '</div>';
    }

    return `
    <html>
    <head>
        <title>Player Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #1E1B26;
                --surface: #2A2438;
                --primary: #A78BFA; /* A nice, focused purple */
                --text-primary: #F5F5F5;
                --text-secondary: #A3A3A3;
                --surface-darker: #3D3652;
            }
            body { font-family: 'IBM Plex Sans', sans-serif; background: var(--background); color: var(--text-primary); padding: 40px; margin: 0; }
            .container { background: var(--surface); border: 2px solid var(--primary); border-radius: 16px; max-width: 900px; margin: auto; padding: 40px; box-shadow: 0 0 35px rgba(167, 139, 250, 0.2); }
            h1 { font-family: 'Exo 2', sans-serif; color: var(--primary); font-size: 2.5em; margin: 0 0 10px 0; }
            .player-msg { font-size: 1.3em; color: var(--text-secondary); margin-bottom: 30px; }
            .data-list p { background: var(--surface-darker); padding: 12px; border-left: 4px solid var(--primary); border-radius: 4px; margin: 10px 0; }
            .data-list .label { font-weight: 500; color: var(--text-primary); }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
            .data-table th, .data-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--surface-darker); vertical-align: middle; overflow-wrap: break-word; }
            .data-table th { background-color: var(--primary); color: #1E1B26; font-weight: 500; }
            .data-table tbody tr:hover { background-color: var(--surface-darker); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="player-msg">${message}</p>
            ${dataHtml.length > 0 ? dataHtml : ''}
        </div>
    </body>
    </html>`;
}

// Generates a simple HTML error page
function generateErrorHTML(res, statusCode, message) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Error ${statusCode}</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f8d7da; color: #721c24; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 80px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 32px; }
            h1 { color: #dc3545; }
            p { margin-top: 16px; }
            a { color: #721c24; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Error ${statusCode}</h1>
            <p>${message || 'An unexpected error occurred.'}</p>
            <p><a href="javascript:history.back()">Go Back</a></p>
        </div>
    </body>
    </html>
    `;
    res.status(statusCode).send(html);
}

module.exports = {
    generatePlayerHTML,
    generateErrorHTML
};
