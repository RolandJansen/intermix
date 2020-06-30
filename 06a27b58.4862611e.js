(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{103:function(e,t,a){"use strict";a.r(t),a.d(t,"frontMatter",(function(){return l})),a.d(t,"metadata",(function(){return b})),a.d(t,"rightToc",(function(){return d})),a.d(t,"default",(function(){return u}));var n=a(2),i=a(6),r=(a(0),a(129)),l={},b={id:"CHANGELOG",isDocsHomePage:!1,title:"CHANGELOG",description:"This project adheres to Semantic Versioning.",source:"@site/docs\\CHANGELOG.md",permalink:"/intermix/docs/CHANGELOG",editUrl:"https://github.com/RolandJansen/intermix/tree/homepage/docs/CHANGELOG.md",sidebar:"someSidebar",previous:{title:"API messages",permalink:"/intermix/docs/"}},d=[{value:"0.5.0 - 2020-06-30",id:"050---2020-06-30",children:[{value:"Added",id:"added",children:[]},{value:"Changed",id:"changed",children:[]},{value:"Removed",id:"removed",children:[]}]},{value:"0.4.0 - 2019-12-12",id:"040---2019-12-12",children:[{value:"Added",id:"added-1",children:[]},{value:"Changed",id:"changed-1",children:[]},{value:"Removed",id:"removed-1",children:[]}]},{value:"0.3.0 - 2016-05-27",id:"030---2016-05-27",children:[{value:"Fixed",id:"fixed",children:[]},{value:"Added",id:"added-2",children:[]}]},{value:"0.2.0 - 2016-05-14",id:"020---2016-05-14",children:[{value:"Fixed",id:"fixed-1",children:[]},{value:"Added",id:"added-3",children:[]}]},{value:"0.1.0 - 2016-04-08",id:"010---2016-04-08",children:[{value:"Added",id:"added-4",children:[]}]}],c={rightToc:d};function u(e){var t=e.components,a=Object(i.a)(e,["components"]);return Object(r.b)("wrapper",Object(n.a)({},c,a,{components:t,mdxType:"MDXLayout"}),Object(r.b)("p",null,"This project adheres to ",Object(r.b)("a",Object(n.a)({parentName:"p"},{href:"http://semver.org/"}),"Semantic Versioning"),"."),Object(r.b)("h2",{id:"050---2020-06-30"},Object(r.b)("a",Object(n.a)({parentName:"h2"},{href:"https://github.com/RolandJansen/intermix.js/compare/v0.4.0...HEAD"}),"0.5.0")," - 2020-06-30"),Object(r.b)("h3",{id:"added"},"Added"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"New API based on OSC-like messages"),Object(r.b)("li",{parentName:"ul"},"Redux middleware for parsing OSC-like messages"),Object(r.b)("li",{parentName:"ul"},"Custom reducer composition"),Object(r.b)("li",{parentName:"ul"},"Sequencer parts (SeqPart) state is managed in the Redux store"),Object(r.b)("li",{parentName:"ul"},"Demo: HTML Stepsequencer based on NexusUI"),Object(r.b)("li",{parentName:"ul"},"All instrument plugins have a volume action by default"),Object(r.b)("li",{parentName:"ul"},"Abstract class for controller plugins"),Object(r.b)("li",{parentName:"ul"},"Prettier"),Object(r.b)("li",{parentName:"ul"},"ESLint (switched back)")),Object(r.b)("h3",{id:"changed"},"Changed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"License switched: Apache License v2.0 -> LGPL v3"),Object(r.b)("li",{parentName:"ul"},"New release plan for shorter dev cycles"),Object(r.b)("li",{parentName:"ul"},"Sequencer refactoring"),Object(r.b)("li",{parentName:"ul"},"Score refactoring (new, memory efficient datastructure)"),Object(r.b)("li",{parentName:"ul"},"SeqPart refactoring"),Object(r.b)("li",{parentName:"ul"},"Runqueue completely rewritten (new datastructure and pointer management)"),Object(r.b)("li",{parentName:"ul"},"New registry architecture (master-registry, item-registries)"),Object(r.b)("li",{parentName:"ul"},"Redux store normalized")),Object(r.b)("h3",{id:"removed"},"Removed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"Bower support"),Object(r.b)("li",{parentName:"ul"},"TSLint"),Object(r.b)("li",{parentName:"ul"},"Old HTML Demos"),Object(r.b)("li",{parentName:"ul"},"Old registry")),Object(r.b)("h2",{id:"040---2019-12-12"},Object(r.b)("a",Object(n.a)({parentName:"h2"},{href:"https://github.com/RolandJansen/intermix.js/compare/v0.3.0...v0.4.0"}),"0.4.0")," - 2019-12-12"),Object(r.b)("h3",{id:"added-1"},"Added"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"Webpack"),Object(r.b)("li",{parentName:"ul"},"Typescript"),Object(r.b)("li",{parentName:"ul"},"TSLint"),Object(r.b)("li",{parentName:"ul"},"Redux"),Object(r.b)("li",{parentName:"ul"},"Github CI actions"),Object(r.b)("li",{parentName:"ul"},"Benchmark tests"),Object(r.b)("li",{parentName:"ul"},"Registry that generates Redux action-creators, state and reducers at runtime")),Object(r.b)("h3",{id:"changed-1"},"Changed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"Project Code migrated from Javascript (ES5) to Typescript"),Object(r.b)("li",{parentName:"ul"},"Tests migrated from Jasmine to Jest"),Object(r.b)("li",{parentName:"ul"},"Sequencer: New algorithm for frame animation that runs\nat least 6 times faster (@120bpm without stall/resume).\nIn reality, speed improvement should be even higher."),Object(r.b)("li",{parentName:"ul"},"Sequencer: Minor speed optimizations."),Object(r.b)("li",{parentName:"ul"},"README.md improved."),Object(r.b)("li",{parentName:"ul"},"CHANGELOG.md improved."),Object(r.b)("li",{parentName:"ul"},"Refactoring of nearly everything")),Object(r.b)("h3",{id:"removed-1"},"Removed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"Old Dispatcher"),Object(r.b)("li",{parentName:"ul"},"SoundWave class"),Object(r.b)("li",{parentName:"ul"},"ESLint"),Object(r.b)("li",{parentName:"ul"},"Travis CI jobs")),Object(r.b)("h2",{id:"030---2016-05-27"},Object(r.b)("a",Object(n.a)({parentName:"h2"},{href:"https://github.com/RolandJansen/intermix.js/compare/v0.2.0...v0.3.0"}),"0.3.0")," - 2016-05-27"),Object(r.b)("h3",{id:"fixed"},"Fixed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"Minified build broken."),Object(r.b)("li",{parentName:"ul"},"Sound: Note values ignored in note events.")),Object(r.b)("h3",{id:"added-2"},"Added"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"EventBus class with relays for controllers, instruments and fx."),Object(r.b)("li",{parentName:"ul"},"Distribution Test Suite for testing packages previous to release."),Object(r.b)("li",{parentName:"ul"},"Stepsequencer demo: adjustable note values for bass track"),Object(r.b)("li",{parentName:"ul"},"CHANGELOG.md")),Object(r.b)("h2",{id:"020---2016-05-14"},Object(r.b)("a",Object(n.a)({parentName:"h2"},{href:"https://github.com/RolandJansen/intermix.js/compare/v0.1.0...v0.2.0"}),"0.2.0")," - 2016-05-14"),Object(r.b)("h3",{id:"fixed-1"},"Fixed"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"SoundWave: audio buffer undefined while file is loading.")),Object(r.b)("h3",{id:"added-3"},"Added"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"SoundWave: multiple files/buffers can be loaded into one SoundWave object."),Object(r.b)("li",{parentName:"ul"},"Sequencer: sample-accurate pause/resume (experimental)."),Object(r.b)("li",{parentName:"ul"},"SoundWave demo."),Object(r.b)("li",{parentName:"ul"},"Stepsequencer demo: reset button."),Object(r.b)("li",{parentName:"ul"},"Project Description in README.md.")),Object(r.b)("h2",{id:"010---2016-04-08"},Object(r.b)("a",Object(n.a)({parentName:"h2"},{href:"https://github.com/RolandJansen/intermix.js/compare/ae47095652376e5c541b674bc064bddb64e7162b...5d4c9e61b8d74a285e1404588d50bed970e7713c"}),"0.1.0")," - 2016-04-08"),Object(r.b)("h3",{id:"added-4"},"Added"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"SoundWave class"),Object(r.b)("li",{parentName:"ul"},"Sound class"),Object(r.b)("li",{parentName:"ul"},"Sequencer class"),Object(r.b)("li",{parentName:"ul"},"Part class"),Object(r.b)("li",{parentName:"ul"},"core module"),Object(r.b)("li",{parentName:"ul"},"event module"),Object(r.b)("li",{parentName:"ul"},"schedule-worker module"),Object(r.b)("li",{parentName:"ul"},"main module (entrypoint)"),Object(r.b)("li",{parentName:"ul"},"Sound demo"),Object(r.b)("li",{parentName:"ul"},"Stepsequencer demo")))}u.isMDXComponent=!0}}]);