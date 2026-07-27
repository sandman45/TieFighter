export default {
    missionOne: {
        active: true,
        type: "CAMPAIGN",
        menuName: "Mission One",
        title: "Skirmish at Outpost D-34",
        // one-line summary shown on the campaign/battle-select screen — any
        // mission flipped to active:true should supply one too
        tagline: "Intercept Rebel smugglers fleeing through the Javin sector.",
        prelude: "Following the recent Rebel defeat on the planet Hoth, freighter traffic began to increase in the Javin sector. Imperial Intelligence suspected a connection and believed that the Rebels would try to pass through this checkpoint. One of their pilots, Maarek Stele, who had been stationed there following Admiral Mordon's death would prove that hypothesis.",
        aftermath: "The captured freighter carried 10 individuals, some of them were Mugaari sympathisers. Imperial Intelligence hoped to learn more about the Rebel activity in the sector through the prisoners. Admiral Flanken and Major Thorbo were the ones who interrogated the prisoners for the desired base of operations and plans using an Interrogation droid to extract every detail they could get. To Stele it reminded him of being a Bordali prisoner, but figured that it served the Rebels right.\n" +
            "\n" +
            "Another thing was that Alliance forces in the area upon hearing the unsuccessful smuggle attempt believed that if they could not smuggle their forces out of this sector, they may have to force their way out. This would lead to the First Battle of Javin.",
        briefing: {
            officer: {
                name: "ADM. THRAWN",
                rank: "FLEET ADMIRAL · ISD CHIMAERA",
                image: "./images/impirials/thrawn.png",
                speech: '"Pilot, the Rebels grow desperate. Do not let them escape."'
            },
            sector: "JAVIN SECTOR · OUTPOST D-34",
            mapWaypoints: [
                { id: 'start',     x: 0.55, y: 0.32, label: 'LAUNCH POINT',    type: 'player'                 },
                { id: 'isd',       x: 0.55, y: 0.30, label: 'ISD VICTORIOUS',  type: 'friendly'               },
                { id: 'nav1',      x: 0.60, y: 0.38, label: 'NAV 1',           type: 'nav',     primary: true  },
                { id: 'shuttle',   x: 0.65, y: 0.45, label: 'TYDERIAN',        type: 'friendly'               },
                { id: 'nav2',      x: 0.72, y: 0.48, label: 'NAV 2',           type: 'nav',     primary: true  },
                { id: 'transport', x: 0.80, y: 0.50, label: 'FREIGHTER TRAFFIC', type: 'friendly'             },
                { id: 'nav3',      x: 0.72, y: 0.40, label: 'NAV 3',           type: 'nav',     primary: true  },
                // V formation — GOLD_LEADER at the tip nearest the ISD, GOLD_TWO/THREE
                // trailing behind on either side, matching their in-game spawn wedge
                { id: 'reb1',      x: 0.22, y: 0.63, label: 'GOLD LEADER',     type: 'enemy'                  },
                { id: 'reb2',      x: 0.22, y: 0.70, label: 'GOLD TWO',        type: 'enemy'                  },
                { id: 'reb3',      x: 0.15, y: 0.63, label: 'GOLD THREE',      type: 'enemy'                  },
                { id: 'atkwp',     x: 0.42, y: 0.43, label: 'ATTACK VECTOR',   type: 'target'                 },
            ],
            flightPath: ['start', 'nav1', 'shuttle', 'nav2', 'transport', 'nav3', 'isd'],
            enemyFlightPath: ['reb1', 'atkwp', 'isd'],
            topics: {
                situation: {
                    header: 'SITUATION REPORT',
                    text: `
                    <p>Following the Rebel defeat on <span class="highlight">HOTH</span>, freighter traffic has increased in the <span class="highlight">JAVIN SECTOR</span>. Imperial Intelligence suspects Rebel forces are attempting to pass through <span class="highlight">OUTPOST D-34</span>.</p>
                    <p>Three Y-Wing bombers designated <span class="highlight">GOLD SQUADRON</span> have been detected on an attack vector toward the <span class="highlight">ISD VICTORIOUS</span>. You will intercept and destroy them before they reach the Star Destroyer.</p>
                    <p>Several freighters are inbound through the checkpoint. It is not yet known which, if any, is carrying Rebel sympathizers — each must be inspected. <span class="highlight">SHUTTLE TYDERIAN</span> is standing by at the ISD, ready to launch and board whichever transport is confirmed. Once under way, the shuttle must not be interrupted.</p>
                    <p>Imperial Intelligence warns that if Rebel sympathizers are confirmed aboard a transport, an escort of Rebel starfighters is likely lurking nearby and will move to intercept <span class="highlight">SHUTTLE TYDERIAN</span> once it takes the prisoners aboard. Be ready to engage additional hostiles the moment a transport is identified.</p>
                `
                },
                objectives: {
                    header: 'PRIMARY OBJECTIVES',
                    text: `
                    <div class="objective-item"><span class="obj-marker">►</span><span>Destroy all <span class="highlight">GOLD SQUADRON</span> Y-Wing bombers</span></div>
                    <div class="objective-item"><span class="obj-marker">►</span><span>Protect <span class="highlight">ISD VICTORIOUS</span> from bomber attack runs</span></div>
                    <div class="objective-item"><span class="obj-marker">►</span><span>Protect the confirmed transport during boarding operations</span></div>
                    <div class="objective-item"><span class="obj-marker">►</span><span>Escort <span class="highlight">SHUTTLE TYDERIAN</span> through its boarding run and back to the ISD</span></div>
                    <p style="margin-top:10px; color: var(--text-dim); font-size:9px;">Loss of the ISD Victorious, the boarded transport, or Shuttle Tyderian will result in mission failure.</p>
                `
                },
                secondary: {
                    header: 'SECONDARY OBJECTIVES',
                    text: `
                    <div class="objective-item"><span class="obj-marker">◆</span><span>Inspect incoming freighter traffic for <span class="highlight">REBEL CONTRABAND</span></span></div>
                    <p style="margin-top:10px; color: var(--text-dim); font-size:9px;">Secondary objectives are optional but will be noted in your Imperial service record.</p>
                `
                },
                craft: {
                    header: 'FLIGHT ASSIGNMENT',
                    text: `
                    <p>ASSIGNED CRAFT: <span class="highlight">TIE/LN FIGHTER</span></p>
                    <p>DESIGNATION: <span class="highlight">ALPHA ONE</span></p>
                    <p>WING: <span class="highlight">ALPHA SQUADRON</span></p>
                    <p style="margin-top:8px;">LOADOUT:</p>
                    <div class="objective-item"><span class="obj-marker">·</span><span>LASER CANNONS — STANDARD</span></div>
                    <div class="objective-item"><span class="obj-marker">·</span><span>NO WARHEAD CAPACITY</span></div>
                    <div class="objective-item"><span class="obj-marker">·</span><span>NO SHIELDS — SPEED IS YOUR DEFENSE</span></div>
                    <p style="margin-top:8px; color: var(--text-dim); font-size:9px;">The TIE/ln has no shields or hyperdrive. Do not stray from the operational area.</p>
                `
                },
                threats: {
                    header: 'THREAT ASSESSMENT',
                    text: `
                    <p>CONFIRMED HOSTILES:</p>
                    <div class="objective-item"><span class="obj-marker" style="color:#cc2200">▲</span><span><span class="highlight">GOLD SQUADRON</span> — 3× BTL Y-WING · MEDIUM THREAT</span></div>
                    <p style="margin-top:8px; color: var(--text-dim); font-size:9px;">Y-Wings are heavily armoured with shields. Attack from the rear. They will attempt attack runs on the ISD — do not let them reach weapons range.</p>
                    <p style="margin-top:8px;">POSSIBLE HOSTILES:</p>
                    <div class="objective-item"><span class="obj-marker" style="color:#cc2200">▲</span><span>UNIDENTIFIED X-WING ESCORT · MEDIUM THREAT</span></div>
                    <p style="margin-top:8px; color: var(--text-dim); font-size:9px;">Not yet detected. If a transport is confirmed to be carrying Rebel sympathizers, expect X-Wing fighters to arrive without warning and target SHUTTLE TYDERIAN in an attempt to free the prisoners — they will turn on you if the shuttle is destroyed first.</p>
                `
                }
            }
        },
        player: {
            designation: "ALPHA_ONE",
            playerName: "PLAYER1",
            name: 'TIE_FIGHTER',
            hull: 100,
            shields: 0,
            position: { x: 20, y: 40, z: 40 },
            rotation: { y: 3.15, x:0, z:0 },
            speed: .6,
            scale: .25,
            rollSpeed: .009,
            autoForward: false,
            faction: "IMPERIAL"
        },
        objectives: {
            destroyDesignations: ["GOLD_LEADER", "GOLD_TWO", "GOLD_THREE"],
            protectDesignations: ["VICTORIOUS", "TYDERIAN", "TRANSPORT_A"],
            inspectDesignations: ["TRANSPORT_A"],
            // mission isn't "complete" the instant TRANSPORT_A is identified —
            // TYDERIAN still has to fly the boarding run and dock back at the
            // ISD with the prisoners (see ShuttleFSM's SHUTTLE_DOCKED post)
            escortDesignations: ["TYDERIAN"],
            dockDesignation: "VICTORIOUS"
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
                position: { x: 20, y: 40, z: 40 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .6,
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
                speed: .002,
                scale: 40,
                hull: 10000,
                shields: 1000,
                rollSpeed: .009,
                autoForward: false,
                faction: "IMPERIAL",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TYDERIAN",
                name: 'SHUTTLE',
                // parked at the ISD's own dock point (VICTORIOUS.position with
                // ShuttleFSM's home dockY/patrolZ+riseZOffset applied) so it
                // starts already docked in the hangar, not floating nearby
                position: { x: 20, y: 70, z: -90 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .20,
                scale: 3,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "IMPERIAL",
                // TYDERIAN stays docked at VICTORIOUS (home) until this
                // designation is identified by the player (see
                // InspectionManager/MissionObjectives) — only then does
                // ShuttleFSM undock it from the ISD and send it to dock with
                // the transport, then bring it back to dock at the ISD again
                homeDesignation: "VICTORIOUS",
                dockTarget: "TRANSPORT_A",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TRANSPORT_A",
                name: 'TRANSPORT',
                position: { x: 1000, y: 50, z: 10 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .10,
                scale: 1,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "NEUTRAL",
                cargo: "Rebel Sympathizers",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TRANSPORT_B",
                name: 'TRANSPORT',
                position: { x: 1140, y: 65, z: 90 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .10,
                scale: 1,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "NEUTRAL",
                cargo: "Machine Parts",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TRANSPORT_C",
                name: 'TRANSPORT',
                position: { x: 860, y: 35, z: -110 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .10,
                scale: 1,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "NEUTRAL",
                cargo: "Medical Supplies",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TRANSPORT_D",
                name: 'TRANSPORT',
                position: { x: 1080, y: 80, z: -180 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .10,
                scale: 1,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "NEUTRAL",
                cargo: "Mining Equipment",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "TRANSPORT_E",
                name: 'TRANSPORT',
                position: { x: 950, y: 20, z: 140 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .10,
                scale: 1,
                hull: 100,
                shields: 100,
                rollSpeed: .009,
                turnRate: 0.006,
                autoForward: false,
                faction: "NEUTRAL",
                cargo: "Foodstuffs",
                weapons: {
                    firing: false
                }
            },
        ],
        rebels: [
            {
                designation: "GOLD_LEADER",
                name: 'Y_WING',
                position: { x: -775, y: 1, z: -850 },  // tip of the V, leading TWO/THREE toward the ISD
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .25,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                faction: "REBELLION",
                target: "ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_TWO",
                name: 'Y_WING',
                position: { x: -855, y: 1, z: -875 },  // trailing left of leader
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .25,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                faction: "REBELLION",
                target: "ISD",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "GOLD_THREE",
                name: 'Y_WING',
                position: { x: -800, y: 1, z: -930 },  // trailing right of leader
                rotation: { y: 3.15, x:0, z:0, rotating: false },
                speed: .25,
                scale: 5,
                hull: 150,
                shields: 125,
                rollSpeed: .009,
                autoForward: false,
                faction: "REBELLION",
                target: "ISD",
                weapons: {
                    firing: false
                }
            },
            // Rebel intercept flight — hidden and off the targeting scope
            // (ModelLoader's arrived flag) at a spawn point roughly as far out
            // as GOLD squadron's (~1150-1200 units from the ISD) but in a
            // distinct location — GOLD approaches from far -X/-Z, the
            // transport cluster sits at x:860-1140/z:-180..180, so these come
            // in from far +Z instead. They stay hidden until the player
            // identifies TRANSPORT_A (the same moment that clears TYDERIAN to
            // launch, see ShuttleFSM) — at that instant they "hyperspace in"
            // (become visible/targetable) and immediately fly at TYDERIAN's
            // CURRENT live position — not a fixed point — falling back to the
            // player only once TYDERIAN's destroyed (InterceptorFSM).
            // Keep well inside +/-1500 (floor.size is 3000x3000 — see Floor.js's
            // checkCollision): a spawn past that border is flagged as a
            // permanent "floor-border" collision, which silently blocks
            // flightUpdate from ever moving the ship, exactly like
            // RED_TWO/RED_THREE did at x:1580 before.
            {
                designation: "RED_LEADER",
                name: 'X_WING',
                position: { x: -100, y: 150, z: 1150 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .3,
                scale: 5,
                hull: 120,
                shields: 100,
                rollSpeed: .012,
                turnRate: 0.008,
                autoForward: false,
                faction: "REBELLION",
                spawnTrigger: "TRANSPORT_A",
                escortTarget: "TYDERIAN",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "RED_TWO",
                name: 'X_WING',
                position: { x: -220, y: 130, z: 1230 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .3,
                scale: 5,
                hull: 120,
                shields: 100,
                rollSpeed: .012,
                turnRate: 0.008,
                autoForward: false,
                faction: "REBELLION",
                spawnTrigger: "TRANSPORT_A",
                escortTarget: "TYDERIAN",
                weapons: {
                    firing: false
                }
            },
            {
                designation: "RED_THREE",
                name: 'X_WING',
                position: { x: 20, y: 130, z: 1230 },
                rotation: { y: 3.15, x:0, z:0 },
                speed: .3,
                scale: 5,
                hull: 120,
                shields: 100,
                rollSpeed: .012,
                turnRate: 0.008,
                autoForward: false,
                faction: "REBELLION",
                spawnTrigger: "TRANSPORT_A",
                escortTarget: "TYDERIAN",
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
