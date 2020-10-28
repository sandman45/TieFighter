const config = {
    controls: {
        flightControls: true,
        controls: false,
    },
    audio: {
        music: true,
        musicVolume: 20,
        sfx: true,
        sfxVolume: 30,
    },
    floor: {
        size: { x: 500, y: 500 },
        transparent: false
    },
    players: [
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
            scale: .5,
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
            name: 'TIE_DEFENDER',
            position: { x: 10, y: 1, z: 10 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: 1,
            scale: 3,
            rollSpeed: .009,
            autoForward: false
        },
        {
            name: 'ISD',
            position: { x: 20, y: 20, z: 10 },
            rotation: { y: 0, x:0, z:0 },
            speed: .2,
            scale: 10,
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
};

export default config;
