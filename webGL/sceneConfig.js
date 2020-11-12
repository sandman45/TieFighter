const config = {
    // working need to make it a real menu etc
    menu: {
        imperials: [
            // {
            //     name: 'TIE_ADVANCED',
            //     position: { x: 10, y: 1, z: -10 },
            //     rotation: { y: 3.15, x:0, z:0 },
            //     speed: .9,
            //     scale: 3,
            //     hull: 100,
            //     shields: 100,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
            {
                name: 'TIE_FIGHTER',
                position: { x: 10, y: 1, z: 1 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                hull: 100,
                shields: 0,
                rollSpeed: .009,
                autoForward: false
            },
            // {
            //     name: 'TIE_BOMBER',
            //     position: { x: 15, y: 1, z: 1 },
            //     rotation: { y: 3.15, x:0, z:0 },
            //     speed: .5,
            //     scale: 3,
            //     hull: 200,
            //     shields: 0,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
            // {
            //     name: 'ISD',
            //     position: { x: 20, y: 40, z: 10 },
            //     rotation: { y: 0, x:0, z:0 },
            //     speed: .2,
            //     scale: 20,
            //     hull: 10000,
            //     shields: 1000,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
            // {
            //     name: 'TIE_INTERCEPTOR',
            //     position: { x: 5, y: 1, z: -5 },
            //     rotation: { y: 3.15, x:0, z:0 },
            //     speed: .8,
            //     scale: 3,
            //     hull: 150,
            //     shields: 0,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
            // {
            //     name: 'SHUTTLE',
            //     position: { x: 20, y: 15, z: -20 },
            //     rotation: { y: 3.15, x:0, z:0 },
            //     speed: .4,
            //     scale: 3,
            //     hull: 100,
            //     shields: 100,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
            // {
            //     name: 'TIE_DEFENDER',
            //     position: { x: 10, y: 1, z: 20 },
            //     rotation: { y: 3.15, x:0, z:0 },
            //     speed: .8,
            //     scale: 3,
            //     hull: 150,
            //     shields: 150,
            //     rollSpeed: .009,
            //     autoForward: false
            // },
        ],
        rebels: [
            {
                name: 'A_WING',
                position: { x: -20, y: 1, z: -20 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .9,
                scale: 3,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'B_WING',
                position: { x: -25, y: 1, z: -25 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: 5,
                hull: 150,
                shields: 150,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'X_WING',
                position: { x: -30, y: 1, z: -30 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .6,
                hull: 125,
                shields: 100,
                scale: 4,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'Y_WING',
                position: { x: -35, y: 1, z: -35 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false
            },
        ],
    },
    shipSelect: {
        imperials: [
            {
                name: 'TIE_FIGHTER',
                position: { x: 0, y: 1, z: 0 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                hull: 100,
                shields: 0,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'TIE_INTERCEPTOR',
                position: { x: 10, y: 1, z: 0 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .8,
                scale: 3,
                hull: 150,
                shields: 0,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'TIE_ADVANCED',
                position: { x: 20, y: 1, z: 0 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .9,
                scale: 3,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'TIE_DEFENDER',
                position: { x: 30, y: 1, z: 0 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .8,
                scale: 3,
                hull: 150,
                shields: 150,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'TIE_BOMBER',
                position: { x: 40, y: 1, z: 0 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .5,
                scale: 3,
                hull: 200,
                shields: 0,
                rollSpeed: .009,
                autoForward: false
            },
        ],
        rebels: [
            {
                name: 'A_WING',
                position: { x: -60, y: 1, z: -80 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .9,
                scale: 3,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'X_WING',
                position: { x: -50, y: 1, z: -50 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .6,
                hull: 125,
                shields: 100,
                scale: 4,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'B_WING',
                position: { x: -90, y: 1, z: -90 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: 5,
                hull: 150,
                shields: 150,
                rollSpeed: .009,
                autoForward: false
            },
            {
                name: 'Y_WING',
                position: { x: -100, y: 1, z: -100 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false
            },
        ]
    },
    campaign: {
        // working need to give enemy ships some AI
        missionOne: {
            active: false,
            player: {
                designation: "ALPHA_ONE",
                playerName: "PLAYER1",
                name: 'TIE_FIGHTER',
                hull: 100,
                shields: 0,
                position: { x: 10, y: 1, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: 1.5,
                scale: .25,
                rollSpeed: .009,
                autoForward: false
            },
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
            imperials: [
                {
                    designation: "VICTORIOUS",
                    name: 'ISD',
                    position: { x: 20, y: 40, z: 10 },
                    rotation: { y: 0, x:0, z:0 },
                    speed: .2,
                    scale: 20,
                    hull: 10000,
                    shields: 1000,
                    rollSpeed: .009,
                    autoForward: false
                },
                {
                    designation: "TYDERIAN",
                    name: 'SHUTTLE',
                    position: { x: 20, y: 15, z: -20 },
                    rotation: { y: 3.15, x:0, z:0 },
                    speed: .4,
                    scale: 3,
                    hull: 100,
                    shields: 100,
                    rollSpeed: .009,
                    autoForward: false
                },
            ],
            rebels: [
                {
                    designation: "GOLD_LEADER",
                    name: 'Y_WING',
                    position: { x: -30, y: 1, z: -30 },
                    rotation: { y: 3.15, x:0, z:0 },
                    speed: .5,
                    scale: 5,
                    hull: 150,
                    shields: 125,
                    rollSpeed: .009,
                    autoForward: false
                },
                {
                    designation: "GOLD_TWO",
                    name: 'Y_WING',
                    position: { x: -35, y: 1, z: -35 },
                    rotation: { y: 3.15, x:0, z:0 },
                    speed: .5,
                    scale: 5,
                    hull: 150,
                    shields: 125,
                    rollSpeed: .009,
                    autoForward: false
                },
                {
                    designation: "GOLD_THREE",
                    name: 'Y_WING',
                    position: { x: -40, y: 1, z: -40 },
                    rotation: { y: 3.15, x:0, z:0 },
                    speed: .5,
                    scale: 5,
                    hull: 150,
                    shields: 125,
                    rollSpeed: .009,
                    autoForward: false
                },
            ]
        },
    },
    multiPlayer: {
          room: "Game",
          connect: false,
          start: false,
          active: false,
          selection: {
              TIE_FIGHTER: false,
              TIE_BOMBER: false,
              TIE_INTERCEPTOR: false,
              TIE_DEFENDER: false,
              TIE_ADVANCED: false,
              A_WING: false,
              X_WING: false,
              Y_WING: false,
              B_WING: false
          },
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
          imperials: [
              {
                  name: 'TIE_FIGHTER',
                  position: { x: 10, y: 1, z: 1 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .7,
                  scale: .25,
                  hull: 100,
                  shields: 0,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'TIE_INTERCEPTOR',
                  position: { x: 20, y: 1, z: 1 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .8,
                  scale: 3,
                  hull: 150,
                  shields: 0,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'TIE_ADVANCED',
                  position: { x: 20, y: 1, z: -10 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .9,
                  scale: 3,
                  hull: 100,
                  shields: 100,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'TIE_DEFENDER',
                  position: { x: 40, y: 1, z: 40 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .8,
                  scale: 3,
                  hull: 150,
                  shields: 150,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'TIE_BOMBER',
                  position: { x: 40, y: 1, z: 10 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .5,
                  scale: 3,
                  hull: 200,
                  shields: 0,
                  rollSpeed: .009,
                  autoForward: false
              },
          ],
          rebels: [
              {
                  name: 'A_WING',
                  position: { x: -60, y: 1, z: -80 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .9,
                  scale: 3,
                  hull: 100,
                  shields: 100,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'X_WING',
                  position: { x: -50, y: 1, z: -50 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .6,
                  hull: 125,
                  shields: 100,
                  scale: 4,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'B_WING',
                  position: { x: -90, y: 1, z: -90 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .7,
                  scale: 5,
                  hull: 150,
                  shields: 150,
                  rollSpeed: .009,
                  autoForward: false
              },
              {
                  name: 'Y_WING',
                  position: { x: -100, y: 1, z: -100 },
                  rotation: { y: 3.15, x:0, z:0 },
                  speed: .5,
                  scale: 5,
                  hull: 150,
                  shields: 125,
                  rollSpeed: .009,
                  autoForward: false
              },
          ]
    },
    controls: {
        flightControls: true,
        controls: false,
    },
    audio: {
        music: false,
        musicVolume: .5,
        sfx: true,
        sfxVolume: 5,
    },
    floor: {
        size: { x: 1000, y: 1000, z: 1000 },
        transparent: false
    },
    skyBox: {
        size: { x: 2000, y: 2000, z: 2000},
    },
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
