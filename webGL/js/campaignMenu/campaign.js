export default {
    default:{
        active: false,
        type: "CAMPAIGN",
        menuName: "Aftermath of Hoth",
        url: "https://starwars.fandom.com/wiki/Aftermath_of_Hoth",
        title: "Mugaari Campaign",
        prelude: "Having been defeated, Rebel Alliance forces fled their secret base in all directions, assisted by the supposedly neutral Mugaari.",
        aftermath: "",
        player: {
            designation: "ALPHA_ONE",
            playerName: "PLAYER1",
            name: 'TIE_FIGHTER',
            hull: 100,
            shields: 0,
            position: { x: 10, y: 1, z: 10 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .7,
            scale: .25,
            rollSpeed: .009,
            autoForward: false,
            faction: "IMPERIAL"
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
                designation: "ALPHA_ONE",
                name: 'TIE_FIGHTER',
                hull: 100,
                shields: 0,
                position: { x: 10, y: 1, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "ALPHA_TWO",
                name: 'TIE_FIGHTER',
                hull: 100,
                shields: 0,
                position: { x: 20, y: 1, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "ALPHA_THREE",
                name: 'TIE_FIGHTER',
                hull: 100,
                shields: 0,
                position: { x: 0, y: 1, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "VICTORIOUS",
                name: 'ISD',
                position: { x: 20, y: 40, z: 10 },
                rotation: { y: 0, x:0, z:0 },
                speed: .1,
                scale: 20,
                hull: 10000,
                shields: 1000,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
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
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
        ],
        rebels: [
            {
                designation: "GOLD_LEADER",
                name: 'Y_WING',
                position: { x: -30, y: 1, z: -30 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_TWO",
                name: 'Y_WING',
                position: { x: -35, y: 1, z: -35 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_THREE",
                name: 'Y_WING',
                position: { x: -40, y: 1, z: -40 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
        ]
    },
    missionOne: {
        active: true,
        type: "CAMPAIGN",
        menuName: "Mission One",
        title: "Skirmish at Outpost D-34",
        prelude: "Following the recent Rebel defeat on the planet Hoth, freighter traffic began to increase in the Javin sector. Imperial Intelligence suspected a connection and believed that the Rebels would try to pass through this checkpoint. One of their pilots, Maarek Stele, who had been stationed there following Admiral Mordon's death would prove that hypothesis.",
        aftermath: "The captured freighter carried 10 individuals, some of them were Mugaari sympathisers. Imperial Intelligence hoped to learn more about the Rebel activity in the sector through the prisoners. Admiral Flanken and Major Thorbo were the ones who interrogated the prisoners for the desired base of operations and plans using an Interrogation droid to extract every detail they could get. To Stele it reminded him of being a Bordali prisoner, but figured that it served the Rebels right.\n" +
            "\n" +
            "Another thing was that Alliance forces in the area upon hearing the unsuccessful smuggle attempt believed that if they could not smuggle their forces out of this sector, they may have to force their way out. This would lead to the First Battle of Javin.",
        player: {
            designation: "ALPHA_ONE",
            playerName: "PLAYER1",
            name: 'TIE_FIGHTER',
            hull: 100,
            shields: 0,
            position: { x: 10, y: 1, z: 10 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .7,
            scale: .25,
            rollSpeed: .009,
            autoForward: false,
            faction: "IMPERIAL"
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
                designation: "ALPHA_ONE",
                playerName: "PLAYER1",
                name: 'TIE_FIGHTER',
                hull: 100,
                shields: 0,
                position: { x: 10, y: 1, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .7,
                scale: .25,
                rollSpeed: .009,
                autoForward: false,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
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
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
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
                autoForward: false,
                fsm: true,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
        ],
        rebels: [
            {
                designation: "GOLD_LEADER",
                name: 'Y_WING',
                position: { x: -30, y: 1, z: -30 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_TWO",
                name: 'Y_WING',
                position: { x: -35, y: 1, z: -35 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_THREE",
                name: 'Y_WING',
                position: { x: -40, y: 1, z: -40 },
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .5,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                fsm: true,
                faction: "REBELLION",
                target:"ISD",
                weapons: {
                    firing: false
                }
            },
        ]
    },
  missionTwo: {
      active: false,
      menuName: "Mission Two",
      title: "First Battle of Javin",
      prelude: "Following the capture of BFF-1 bulk freighter Onece 3, the Imperials realized that the Rebels would retaliate by destroying Outpost D-34, so they sent three TIE/LN starfighters from Alpha, Beta, and Gamma squadrons. They were to patrol the station and hold of any Rebel attack until the Imperial-class Star Destroyer Hammer, under the command of Admiral Flanken would arrive to relieve them. Flanken planned to not arrive until much later believing that the initial attack was either a feint or they're testing the situation, once they would commence the full force he would hit them with full power.",
      aftermath: "The Imperials successfully thwarted the Rebel attack and captured some Rebel officers at the same time. They soon traced the attack to a Mugaari cargo loading area in the Tungra sector where they would then decide to counterattack the pirates and the Rebels.",
      player: {
          designation: "ALPHA_ONE",
          playerName: "PLAYER1",
          name: 'TIE_FIGHTER',
          hull: 100,
          shields: 0,
          position: { x: 10, y: 1, z: 10 },
          rotation: { y: 3.15, x:0, z:0 },
          speed: .4,
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
              autoForward: false,
              faction: "IMPERIAL"
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
              autoForward: false,
              faction: "IMPERIAL"
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
              autoForward: false,
              faction: "REBELLION"
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
              autoForward: false,
              faction: "REBELLION"
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
              autoForward: false,
              faction: "REBELLION"
          },
      ]
  }
};
