export default () => ({
    // SERVER_MONGO_URI: process.env.SERVER_MONGO_URI,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    PROJECT_NAME: process.env.PROJECT_NAME,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_SERVER: process.env.BACKEND_SERVER,

    API_BASE_URL: process.env.API_BASE_URL,
    API_CLIENT_ID: process.env.API_CLIENT_ID,
    API_SECRET: process.env.API_SECRET,
    API_GENERATE_RANDOM_PATH: process.env.API_GENERATE_RANDOM_PATH,
    API_METHOD: process.env.API_METHOD,
})