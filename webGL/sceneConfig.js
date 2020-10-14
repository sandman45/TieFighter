const config = {
    floor: {
        size: { x: 500, y: 500 },
        transparent: false
    },
    players: [
        {
            name: 'TIE',
            position: { x: 10, y: 1, z: 1 },
            speed: .8,
            scale: .5,
            rollSpeed: .009,
            autoForward: true
        },
        {
            name: 'NPC',
            position: { x: 15, y: 1, z: 1 },
            speed: .8,
            scale: .5
        }
    ],
    weapons: [
        {
            name: "laser",
            color: "green",
            speed: 2.2,
            position: { x: 0.5, y: 0.5 },
        },
        {
            name: "laser",
            color: "red",
            speed: 2.2,
            position: { x: 0.5, y: 0.5 },
        }
    ],
    sonars: [
        {
            name: "sonar-1",
            position: { x: 0.8, y: 0.8 },
            senseAxis: { x: true, y: false }
        },
        {
            name: "sonar-2",
            position: { x: 0.2, y: 0.2 },
            senseAxis: { x: false, y: true }
        }
    ],
    movingObstacles: [
        {
            name: "moving-obstacle-1",
            position: { x: .5, y: .4 },
            directionAxis: { x: true, y: false },
            speed: 1,
            range: 6
        },
        {
            name: "moving-obstacle-2",
            position: { x: .5, y: .2 },
            directionAxis: { x: true, y: true },
            speed: 2,
            range: 6
        }
    ],
    staticObstacles: [
        {
            name: "static-obstacle-1",
            centerPosition: { x: 0.2, y: 0.5},
            size: { x: 0.4, y: 0.01}
        },
        {
            name: "static-obstacle-2",
            centerPosition: { x: 0.8, y: 0.5},
            size: { x: 0.4, y: 0.01}
        }
    ]
};

export default config;
