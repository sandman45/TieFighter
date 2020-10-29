const config = {
    controls: {
        flightControls: true,
        controls: false,
    },
    audio: {
        music: false,
        musicVolume: 20,
        sfx: true,
        sfxVolume: 30,
    },
    floor: {
        size: { x: 1000, y: 1000, z: 1000 },
        transparent: false
    },
    skyBox: {
        size: { x: 2000, y: 2000, z: 2000},
    },
    players:[
        {
            name: 'TIE_DEFENDER',
            position: { x: 10, y: 1, z: 10 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: 1,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        },
    ],
    imperials: [
        {
            name: 'TIE_ADVANCED',
            position: { x: 10, y: 1, z: -10 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .9,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'TIE',
            position: { x: 10, y: 1, z: 1 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .7,
            scale: .25,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'TIE_BOMBER',
            position: { x: 15, y: 1, z: 1 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .5,
            scale: 3
        },
        {
            name: 'ISD',
            position: { x: 20, y: 40, z: 10 },
            rotation: { y: 0, x:0, z:0 },
            speed: .2,
            scale: 20,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'TIE_INTERCEPTOR',
            position: { x: 5, y: 1, z: -5 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .8,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'SHUTTLE',
            position: { x: 20, y: 15, z: -20 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .4,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        }
    ],
    rebels: [
        {
            name: 'A_WING',
            position: { x: -20, y: 1, z: -20 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .9,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'B_WING',
            position: { x: -25, y: 1, z: -25 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .7,
            scale: 5,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'X_WING',
            position: { x: -30, y: 1, z: -30 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .6,
            scale: 4
        },
        {
            name: 'Y_WING',
            position: { x: -35, y: 1, z: -35 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .5,
            scale: 5,
            rollSpeed: .009,
            autoForward: false
        },
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
};

export default config;
