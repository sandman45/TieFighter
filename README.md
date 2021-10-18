# Tie Fighter

Creating a Tie Fighter game using [PierfrancescoSoffritti's Configurable Three JS App template](https://github.com/PierfrancescoSoffritti/configurable-threejs-app). Check it out 
he has done an amazing job. 

* early version

![Tie Fighter Game](tie-fighter-game.gif)

* latest version

![Tie Fighter Game](tie-fighter-game-2.gif)

### Play it here http://tie-fighter.mattsanders.org

or run it locally

## How to start

### Install

To use this project you need to download all the required modules from npm, to do that run this commands from the root folder of the project

```
cd server
npm install
```

```
cd WebGL
npm install
```

create a `.env` file in the `/server/src/` directory
```
WEB_SERVER=3000
```

### Launch the server

To start the server run this command, from the root folder of the project

```
cd server
cd src
node main
```
### Running on Webstorm

```
click run main.js node
```

server will run port 3000 unless you change the port in the .env file

the web server will run on port 3000 unless changed in the .env file

The webpage will be available at `http://localhost:8080/`

## Scene

The scene is built with Three.js (WebGL) and runs into your browser.


### Realtime scene configuration

The webapp contains a control window that can be used to update in realtime all the configurations in the config file.

