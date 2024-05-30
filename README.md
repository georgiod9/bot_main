# Listener Bot

This script is dedicated to reading logs on bumpers solana program. Its task is simple; catch events of new orders & order cancellations, and then prepare the execution in the form of a list of tasks then sent to Redis server.

## Deployment Steps

**Env Config** / First, setup env variables:

```
ENCRYPT_PASSWORD='' // RANDOM PASSWORD FOR USERS WALLETS ENCRYPTION
MONGODB_URI='' // URI STARTING w/ (mongodb+srv://...)
REDIS_HOST='' // IP WHERE REDIS IS HOSTED
REDIS_PORT='' // REDIS PORT
REDIS_PASSWORD='' // REDIS PASSWORD
```

**Install Dependencies**/ Second, install the required dependencies by running:

`npm install`

**Run the Main Script**/ Last, run main script : 

`npm run start`
