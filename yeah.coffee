// ...inside <script> in cyberpunkAPI.html...
const apiData = {
    registration: {
        title: 'Registration',
        endpoints: [
            { id: 'regCoach', method: 'POST', path: '/reg/coach', description: 'Register a new coach.', params: { body: ['firstname', 'password', 'mobile'] }, defaults: { firstname: 'John Doe', password: 'yourpassword', mobile: '+1234567890' }},
            { id: 'regPlayer', method: 'POST', path: '/reg/player', description: 'Register a new player.', params: { body: ['firstname', 'password', 'mobile'] }, defaults: { firstname: 'Jane Doe', password: 'playerpassword', mobile: '+1987654321' }},
            { id: 'regAdmin', method: 'POST', path: '/reg/admin', description: 'Register a new admin.', params: { body: ['firstname', 'password', 'mobile'] }, defaults: { firstname: 'Admin Doe', password: 'adminpassword', mobile: '+1555555555' }}
        ]
    },
    authentication: {
        title: 'Authentication',
        endpoints: [
            { id: 'loginUser', method: 'POST', path: '/auth/login', description: 'Authenticate to get a JWT token.', params: { body: ['email', 'password'] }, defaults: { email: 'user@vainglory.com', password: 'yourpassword' }}
        ]
    },
    player: {
        title: 'Player Endpoints',
        endpoints: [
            { id: 'getPlayerSchedules', method: 'GET', path: '/player/schedules', description: 'Get the player\'s match schedules.', needsAuth: true, params: {} },
            { id: 'getPlayerMyVods', method: 'GET', path: '/player/myvods', description: 'Get VODs assigned to the player.', needsAuth: true, params: {} },
            { id: 'getPlayerMatchById', method: 'GET', path: '/player/:matchId', description: 'Get a specific match by its ID.', needsAuth: true, params: { path: ['matchId'] }, defaults: { matchId: 1234 } },
            { id: 'reviewVod', method: 'PUT', path: '/player/reviewvod/:vodId', description: 'Add notes to a VOD review.', needsAuth: true, params: { path: ['vodId'], body: ['notes'] }, defaults: { vodId: 3001, notes: 'Great play at 10:00' } },
            { id: 'playerUpdatePassword', method: 'PUT', path: '/player/update-password', description: 'Update your account password.', needsAuth: true, params: { body: ['email', 'oldPassword', 'newPassword'] }, defaults: { email: 'player@email.com', oldPassword: 'oldpass', newPassword: 'newpass' } },
            { id: 'playerResetPassword', method: 'PUT', path: '/player/reset-password', description: 'Reset your account password.', needsAuth: true, params: { body: ['email', 'mobile', 'newPassword'] }, defaults: { email: 'player@email.com', mobile: '1234567890', newPassword: 'newpass' } }
        ]
    },
    coach: {
        title: 'Coach Endpoints',
        endpoints: [
            { id: 'coachCreateSchedule', method: 'POST', path: '/coach/schedule', description: 'Create a new match schedule.', needsAuth: true, params: { body: ['opponent', 'matchDate', 'game'] }, defaults: { opponent: 'TeamX', matchDate: '2025-06-15', game: 'Valorant' } },
            { id: 'coachGetSchedules', method: 'GET', path: '/coach/schedule', description: 'Get all scheduled matches.', needsAuth: true, params: {} },
            { id: 'coachGetScheduleById', method: 'GET', path: '/coach/schedule/:matchId', description: 'Get a specific scheduled match.', needsAuth: true, params: { path: ['matchId'] }, defaults: { matchId: 1234 } },
            { id: 'coachAssignVod', method: 'POST', path: '/coach/assignvod', description: 'Assign a VOD to a player.', needsAuth: true, params: { body: ['matchId', 'playerEmail'] }, defaults: { matchId: 1234, playerEmail: 'player@email.com' } },
            { id: 'coachGetRoster', method: 'GET', path: '/coach/roster', description: 'Get all registered players.', needsAuth: true, params: {} },
            { id: 'coachSearchPlayer', method: 'GET', path: '/coach/player-search', description: 'Search for a player by email or ID.', needsAuth: true, params: { query: ['email', 'id'] }, defaults: { email: 'player@email.com', id: 1001 } },
            { id: 'coachUpdatePassword', method: 'PUT', path: '/coach/update-password', description: 'Update your coach account password.', needsAuth: true, params: { body: ['email', 'currentPassword', 'newPassword'] }, defaults: { email: 'coach@email.com', currentPassword: 'old', newPassword: 'new' } },
            { id: 'coachResetPassword', method: 'PUT', path: '/coach/reset-password', description: 'Reset your coach account password.', needsAuth: true, params: { body: ['email', 'mobile', 'newPassword'] }, defaults: { email: 'coach@email.com', mobile: '1234567890', newPassword: 'newpass' } }
        ]
    },
    admin: {
        title: 'Admin Endpoints',
        endpoints: [
            { id: 'adminGetPlayers', method: 'GET', path: '/admin/players', description: 'Get a list of all players.', needsAuth: true, params: {} },
            { id: 'adminGetCoaches', method: 'GET', path: '/admin/coaches', description: 'Get a list of all coaches.', needsAuth: true, params: {} },
            { id: 'adminGetSchedules', method: 'GET', path: '/admin/schedules', description: 'Get a list of all scheduled matches.', needsAuth: true, params: {} },
            { id: 'adminDeleteUserByEmail', method: 'DELETE', path: '/admin/user', description: 'Delete a user by their email.', needsAuth: true, params: { body: ['email'] }, defaults: { email: 'user@email.com' } },
            { id: 'adminUpdateUserById', method: 'PUT', path: '/admin/user/:id', description: 'Update a user by their ID.', needsAuth: true, params: { path: ['id'], body: ['name', 'mobile'] }, defaults: { id: 1, name: 'New Name', mobile: '+1234567890' } },
            { id: 'adminDeleteUserById', method: 'DELETE', path: '/admin/user/:id', description: 'Delete a user by their ID.', needsAuth: true, params: { path: ['id'] }, defaults: { id: 1 } },
            { id: 'adminUpdateSchedule', method: 'PUT', path: '/admin/schedule/:matchId', description: 'Update a match schedule.', needsAuth: true, params: { path: ['matchId'], body: ['opponent', 'matchDate', 'game'] }, defaults: { matchId: 1, opponent: 'New Team', matchDate: '2025-07-05', game: 'Valorant' } },
            { id: 'adminDeleteSchedule', method: 'DELETE', path: '/admin/schedule/:matchId', description: 'Delete a match schedule.', needsAuth: true, params: { path: ['matchId'] }, defaults: { matchId: 1 } },
            { id: 'adminUpdatePassword', method: 'PUT', path: '/admin/update-password', description: 'Update your admin account password.', needsAuth: true, params: { body: ['email', 'currentPassword', 'newPassword'] }, defaults: { email: 'admin@email.com', currentPassword: 'old', newPassword: 'new' } },
            { id: 'adminResetPassword', method: 'PUT', path: '/admin/reset-password', description: 'Reset your admin account password.', needsAuth: true, params: { body: ['email', 'mobile', 'newPassword'] }, defaults: { email: 'admin@email.com', mobile: '1234567890', newPassword: 'newpass' } },
            { id: 'adminSearchCoach', method: 'GET', path: '/admin/coach-search', description: 'Search for a coach by email or ID.', needsAuth: true, params: { query: ['email', 'id'] }, defaults: { email: 'coach@email.com', id: 2001 } }
        ]
    }
};