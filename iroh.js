console.log('a');
const Iroh = require("../iroh");
const fs = require('fs');
console.log('what');
// Turning test script into string for Iroh stage
const path = '/workspaces/nodebb-s25-eagles/test/posts.js';
const code = "" + fs.readFileSync(path, 'utf8');

// initializing stage
console.log("Iroh running...")
const stage = new Iroh.Stage(code);
stage.addListener (Iroh.call)
.on ("before", (e) => {
    let external = e.external ? "#external" : "";
    console.log(" ".repeat(e.indent) + "call", e.name, external, "(", e.arguments, ")");
})
.on("after", (e) => {
    let external = e.external ? "#external" : "";
    console.log(" ".repeat(e.indent) + "call", e.name, "end", external, "->", [e.return]);
  });
// creating function listeners
  stage.addListener(Iroh.FUNCTION)
.on("enter", (e) => {
  let sloppy = e.sloppy ? "#sloppy" : "";
  if (e.sloppy) {
    console.log(" ".repeat(e.indent) + "call", e.name, sloppy, "(", e.arguments, ")");
  }
})
.on("leave", (e) => {
  let sloppy = e.sloppy ? "#sloppy" : "";
  if (e.sloppy) {
    console.log(" ".repeat(e.indent) + "call", e.name, "end", sloppy, "->", [void 0]);
  }
})
.on("return", (e) => {
  let sloppy = e.sloppy ? "#sloppy" : "";
  if (e.sloppy) {
    console.log(" ".repeat(e.indent) + "call", e.name, "end", sloppy, "->", [e.return]);
  }
});

// begining and end of test
stage.addListener(Iroh.PROGRAM)
.on("enter", (e) => {
  console.log(" ".repeat(e.indent) + "Program");
})
.on("leave", (e) => {
  console.log(" ".repeat(e.indent) + "Program end", "->", e.return);
});

eval (stage.script);