# Tie Fighter

Creating a Tie Fighter game using [PierfrancescoSoffritti's Configurable Three JS App template](https://github.com/PierfrancescoSoffritti/configurable-threejs-app). Check it out 
he has done an amazing job. 

![Tie Fighter Game](tie-fighter-game.gif)


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

Or, if you are on Windows, just double click the `install.bat` file.

### Launch the server

To start the server run this command, from the root folder of the project

```
cd server
cd src
node main portNumber
```
### Running on Webstorm

```
click run main.js node
```
server will run port 3000 unless you change the port in the .env file
the web server will run on port 8080 unless changed in the .env file

The webpage will be available at `http://localhost:8080/`

--
Or, if you are on Windows, just double click the `startServer.bat` file, the server will automatically start on port 8999.

The webpage will be available at `http://localhost:8080/`

## Scene

The scene is built with Three.js (WebGL) and runs into your browser.


### Realtime scene configuration

The webapp contains a control window that can be used to update in realtime all the configurations in the config file.



Changes made here won't be permanent. You alwyas need to manually update the values in the config file.

## Control the player remotely

It's possible to send and receive messages from the server with a TCP connection.

In order to connect to the server you need to establish a simple TCP connection with it using the server ip an port (the ip is the ip of the machine on which it is running, the port is the one you have decided when starting the server).

### IO interface
The server sends and expects specific messages. The messages are simple JSON strings, each string has to start and finish with a `;` symbol.

Message format: `;{ json };`.

#### Server output
Messages from the server to the client have this format: `;{ "type": "event-type", "arg": { ... } };`.

- webpage-ready - `{ "type": "webpage-ready, "arg": {} }`: This message is sent by the server to its clients when the webapp is ready. If a client connects after the page is ready, it will receive the message anyway. Therefore a client connecting to the server can always expect a webpage-ready message.

- sonar-activated - `{ "type:" "sonar-activated", "arg": { "sonarName": "sonarName", "distance": 1, "axis": "x" } }`: This message is sent by the server to its clients when a sonar is sensing the player. `sonarName` is the name of the sonar that is sensing the player. `distance` is the distance of the player from the sonar. `axis` is the axis on which the sonar is sensing the player.

- collision - `{ "type": "collision", "arg": { "objectName": "obstacle-1" } }`: This message is sent by the server to its clients when the player collides with an obstacle in the scene. `objectName` is the name of the object the player is colliding with.

#### Server input
Messages from the client to the server.

- moveForward - `{ "type": "moveForward", "arg": 300 }`: This message is used to move the player in its current forward direction. `arg` is the duration in seconds of the movement. The duration can be negative, in that case the player will move until in encouters an obstacle.

- moveBackward - `{ "type": "moveBackward", "arg": 300 }`: This message is used to move the player in its current backward direction. `arg` is the duration in seconds of the movement. The duration can be negative, in that case the player will move until in encouters an obstacle.

- turnRight - `{ "type": "turnRight", "arg": 300 }`: This message is used to rotate the player. The player will always make a 90° rotation. `arg` is the amount of time the 90° rotation will require.

- turnLeft - `{ "type": "turnLeft", "arg": 300 }`: This message is used to rotate the player. The player will always make a 90° rotation. `arg` is the amount of time the 90° rotation will require.

- alarm - `{ "type": "alarm" }`: This message will stop the player's movement. Rotations aren't stoppable.
