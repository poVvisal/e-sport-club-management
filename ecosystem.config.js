// ecosystem.config.js

// This configuration tells PM2 to change into the specific microservice's
// directory before running the script. This ensures that each service
// can correctly load its own .env file and that logs are stored neatly.

module.exports = {
  apps: [
    {
      name: 'API-Gateway',
      script: 'api-gateway.js',
      cwd: './APIGateway_Microservice/',
      watch: true,
      ignore_watch: ["node_modules"],
      // Log files for standard output and errors
      out_file: './logs/api-gateway-out.log',
      error_file: './logs/api-gateway-err.log',
      // Handles API routing and aggregation for all microservices
    },
    {
      name: 'Registration-Service', // Handles user registration and authentication
      script: 'registration.js',
      cwd: './Registration_Microservice/',
      watch: true,
      ignore_watch: ["node_modules"],
      out_file: './logs/registration-service-out.log',
      error_file: './logs/registration-service-err.log',
    },
    {
      name: 'Coach-Service', // Manages coach-related data and schedules
      script: 'index.js',
      cwd: './Coach_Microservice/',
      watch: true,
      ignore_watch: ["node_modules"],
      out_file: './logs/coach-service-out.log',
      error_file: './logs/coach-service-err.log',
    },
    {
      name: 'Player-Service', // Manages player-related data and schedules
      script: 'index.js',
      cwd: './Player_Microservice/',
      watch: true,
      ignore_watch: ["node_modules"],
      out_file: './logs/player-service-out.log',
      error_file: './logs/player-service-err.log',
    }
  ],
};
