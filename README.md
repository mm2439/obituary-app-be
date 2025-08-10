# Obituary App - Collaboration Instructions

### How to Run Locally

1. PreReqs
    - Node and npm
    - Docker

2. Clone the project (both frontend and backend)

3. If you already have it, then take a pull from main to update your code

4. Run the following commands:

``` 
cd obituar-app-fe
npm i
npm run build
npm start
```
This will start your frontend with the production backend.

#### Backend

If you want to connect backend locally then do the following. 

1. In **obituary-app-fe/config/apiConfig** change ```isDev = false``` to ```isDev = true```

2. Create .env file in obituary-app-be

3. Start Docker
4. Run the following commands:

```
cd obituary-app-be
docker-compose up --build
npm start
```

### Getting your code Merged

1. Make sure that there are no build error. Run your frontend with ```npm run build``` and look for build failures. DON'T PUSH IF YOU ENCOUNTER BUILD FAILURES

2. Run your backend,  and make sure all apis are functional.

3. Make sure to set ```isDev = false``` in apiConfig file.

4. Create a new branch, and commit your changes  and publish the branch
5. Raise a Pull Request, and add ```mm2439``` as a reviewer. 

All devs must read the following instruction carefully. They must abide by it, otherwise they will be dropped from the project immediately.
