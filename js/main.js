
// NFA Model and Simulator
var model = new NFAModel();
var nfa = new NFASimulator(model);
// Keep track of highlighted (active) components
var highlightedStates = [];
var highlightedTransitions = [];
// Number of states, used for naming states s0, s1, s2, etc...
var numStates = 0;

// https://stackoverflow.com/a/2117523
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createStateElement (id, name) {
    const state = document.createElement('div');
    state.dataset.stateName = name;
    state.innerText = name;
    state.id = id;
    state.className += "control";
    state.style.position = 'absolute';
    return state;
}

function addStateElementToDiagram (instance, state, x, y) {
    $(state).css({top: y, left: x});
    instance.getContainer().appendChild(state);
    instance.draggable(state.id, { "containment": true });
    instance.addEndpoint(state.id, {
        endpoint: [ "Dot", { radius: 6 } ],
        anchor: [ "Perimeter", { shape: "Circle"} ],
        isSource: true,
        maxConnections: -1,
        connectionType: "default-connection",
        connectionsDetachable: false
    });
    instance.makeTarget(state, {
        endpoint: [ "Dot", { radius: 1 } ],
        anchor: [ "Perimeter", { shape: "Circle"} ],
        connectionType: "default-connection",
        connectionsDetachable: false
    });
    numStates++;
}

// State context menu handler
$("#diagram").on("contextmenu", ".control", function (event) {
    event.preventDefault();
    window.selectedControl = $(this).attr("id");
    $("#state-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
    $("#transition-context-menu").css({display: "none"});
    $("#body-context-menu").css({display: "none"});
});

// Background context menu handler
$("#diagram").on("contextmenu", function (event) {
    if (event.target.id == "diagram") {
        event.preventDefault();
        $("#state-context-menu").css({display: "none"});
        $("#transition-context-menu").css({display: "none"});
        $("#body-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
    }
});

// Hide context menus when anywhere is left clicked
$(document).bind("click", function (event) {
    $("#state-context-menu").css({display: "none"});
    $("#transition-context-menu").css({display: "none"});
    $("#body-context-menu").css({display: "none"});
});

// Context menu -> Delete state
$(".context-menu").on("click", ".delete-state", function (event) {
    let stateName = $(window.selectedControl).attr("state-name");
    // Remove inbound/outbound transitions for this state
    nfa.model.removeTransitions(stateName);
    // Delete the control from JSPlumb
    instance.remove(window.selectedControl);
});

// Context menu -> Rename state
$(".context-menu").on("click", ".rename-state", function (event) {
    let state = document.getElementById(window.selectedControl);
    let oldName = state.dataset.stateName;
    let newName = prompt("Rename state", oldName);
    // Check this state name is not already in use
    let nameAlreadyUsed = false;
    Object.keys(nfa.model.transitions).forEach(stateA => {
        Object.keys(nfa.model.transitions[stateA]).forEach(character => {
            nfa.model.transitions[stateA][character].forEach(stateB => {
                if (stateA === newName || stateB === newName) {
                    nameAlreadyUsed = true;
                }
            });
        });
    });
    if (nameAlreadyUsed) {
        alert("State name already in use. Please pick a unique state name.");
    }
    else if (newName !== null && newName !== "") {
        // Update transitions where this state is the target
        Object.keys(nfa.model.transitions).forEach(stateA => {
            Object.keys(nfa.model.transitions[stateA]).forEach(character => {
                nfa.model.transitions[stateA][character].forEach((stateB, index) => {
                    if (stateB === oldName) {
                        nfa.model.transitions[stateA][character][index] = newName;
                    }
                });
            });
        });
        // Update transitions where this state is the source
        Object.keys(nfa.model.transitions).forEach(stateA => {
            if (stateA === oldName) {
                nfa.model.transitions[newName] = nfa.model.transitions[oldName];
                nfa.model.transitions[oldName] = {};
            }
        });
        // Update names of starting state if necessary
        if (nfa.model.startState === oldName) {
            nfa.model.startState = newName;
        }
        // Update names of accepting states if necessary
        nfa.model.acceptStates.forEach((acceptState, index) => {
            if (acceptState === oldName) {
                nfa.model.acceptStates[index] = newName;
            }
        });
        // Update DOM element
        state.dataset.stateName = newName;
        state.innerHTML = newName;
    }
});

// Context menu -> Toggle accepting state
$(".context-menu").on("click", ".toggle-accepting-state", function (event) {
    let state = document.getElementById(window.selectedControl);
    let stateName = state.innerHTML;
    if (nfa.model.acceptStates.includes(stateName)) {
        state.classList.remove("accepting");
        nfa.model.acceptStates.splice(nfa.model.acceptStates.indexOf(stateName));
    } else {
        state.classList.add("accepting");
        nfa.model.acceptStates.push(stateName);
    }
});

// Context menu -> Make starting state
$(".context-menu").on("click", ".make-starting-state", function (event) {
    let oldStart = document.querySelector(`[data-state-name='${nfa.model.startState}']`);
    let state = document.getElementById(window.selectedControl);
    let stateName = state.innerHTML;
    if (!state.classList.contains("starting")) {
        state.classList.add("starting");
        nfa.model.setStartState(stateName);
        if (oldStart !== null) {
            oldStart.classList.remove("starting");
        }
    }
});

// Context menu -> Delete transition
$(".context-menu").on("click", ".delete-transition", function (event) {
    let sourceName = window.selectedConnection.source.dataset.stateName;
    let targetName = window.selectedConnection.target.dataset.stateName;
    let characters = window.selectedConnection.getLabel().split(",");
    // Remove this transition within the NFA model
    characters.forEach(character => {
        nfa.model.removeTransition(sourceName, character, targetName);
    });
    // Remove transition from highlighted transitions list
    let index = highlightedTransitions.indexOf(window.selectedConnection);
    if (index > -1) {
        highlightedTransitions.splice(index, 1);
    }
    // Delete the connection from JSPlumb
    instance.deleteConnection(window.selectedConnection);
});

// Context menu -> Edit transition
$(".context-menu").on("click", ".edit-transition", function (event) {
    let sourceName = window.selectedConnection.source.dataset.stateName;
    let targetName = window.selectedConnection.target.dataset.stateName;
    // Create a list of the characters that exist in the transition before editing
    let oldCharacters = [];
    Object.keys(nfa.model.transitions[sourceName]).forEach(character => {
        if (nfa.model.transitions[sourceName][character].indexOf(targetName) > -1) {
            oldCharacters.push(character);
        }
    });
    // Prompt the user for the characters to be in the updated transition
    let newTransition = prompt("Edit transitions.", oldCharacters.join(","))
    if (newTransition !== null && newTransition !== "") {
        newCharacters = newTransition.replace(/[^a-zA-Z0-9_,]/g, "")
                                        .replace("_", "ε")
                                        .toLowerCase()
                                        .split(",")
                                        .filter(char => char.length == 1);
        // Add transition characters that are new (not in the old transition)
        newCharacters.forEach(newCharacter => {
            if (oldCharacters.indexOf(newCharacter) < 0) {
                nfa.model.addTransition(sourceName, newCharacter, targetName);
            }
        });
        // Remove transition characters that are not in the new transition
        oldCharacters.forEach(oldCharacter => {
            if (newCharacters.indexOf(oldCharacter) < 0) {
                nfa.model.removeTransition(sourceName, oldCharacter, targetName);
            }
        })
    }
    // Update the transition label in JSPlumb
    window.selectedConnection.setLabel(newCharacters.join(","));
});

// Context menu -> Create state
$(".context-menu").on("click", ".create-state", function (event) {
    let rect = instance.getContainer().getBoundingClientRect();
    let x = event.pageX - rect.left;
    let y = event.pageY - rect.top;
    const state = createStateElement(uuidv4(), "s"+numStates);
    addStateElementToDiagram(instance, state, x, y);
});

// Toolbox -> Test string
$("#toolbox-wrapper").on("click", "#instant-simulation", function (event) {
    let string = $('#enter-string').val();
    let outputBox = $('#instant-simulation-output');
    outputBox.val(nfa.accepts(string) ? "Accepted" : "Rejected");
});

// Toolbox -> Stop simulation
$("#toolbox-wrapper").on("click", "#stop-simulation", function (event) {
    highlightedStates.forEach(state => $(state).removeClass("highlighted"));
    highlightedTransitions.forEach(transition => transition.setPaintStyle({ stroke: "black", strokeWidth: 2}));
    $("#stop-simulation").prop("disabled", true);
    $("#start-simulation").prop("disabled", false);
    $("#step-simulation").prop("disabled", true);
    $("#instant-simulation").prop("disabled", false);
    $("#simulation-output").val("");
    // Clear tape
    $("#tape-wrapper #start").text("");
    $("#tape-wrapper #middle").text("");
    $("#tape-wrapper #end").text("");
});

// Toolbox -> Start simulation
$("#toolbox-wrapper").on("click", "#start-simulation", function (event) {
    nfa.initialize($('#enter-string').val());
    nfa.step();
    // Highlight the active state
    let highlightedState = $("#diagram").find(`[data-state-name='${nfa.model.startState}']`);
    $(highlightedState).addClass("highlighted");
    highlightedStates.push(highlightedState);
    $("#stop-simulation").prop("disabled", false);
    $("#start-simulation").prop("disabled", true);
    $("#step-simulation").prop("disabled", false);
    $("#instant-simulation").prop("disabled", true);
    // Initialize tape
    $("#tape-wrapper #start").text(nfa.input.substring(0, nfa.index-1));
    $("#tape-wrapper #middle").text(nfa.input.substring(nfa.index-1, nfa.index));
    $("#tape-wrapper #end").text(nfa.input.substring(nfa.index, nfa.input.length));
});

// Toolbox -> Step simulation
$("#toolbox-wrapper").on("click", "#step-simulation", function (event) {
    highlightedTransitions.forEach(transition => transition.setPaintStyle({ stroke: "black", strokeWidth: 2 }));
    if (nfa.status === "running") {
        // Unhighlight all of transitions and states from the previous step
        highlightedStates.forEach(state => $(state).removeClass("highlighted"));
        let previousStates = highlightedStates;
        highlightedStates = [];
        // Perform one step of the automaton
        nfa.step();
        // Highlight newly active states and transitions
        nfa.states.forEach(stateName => {
            // Highlight the active state
            let highlightedState = $("#diagram").find(`[data-state-name='${stateName}']`);
            $(highlightedState).addClass("highlighted");
            highlightedStates.push(highlightedState);
            // Highlight the transitions that lead to the current states
            previousStates.forEach(previousState => {
                let connection = instance.getConnections({
                    source: previousState,
                    target: highlightedState
                })[0];
                if (connection) {
                    highlightedTransitions.push(connection);
                    connection.setPaintStyle({ stroke: "green", strokeWidth: 2 });
                }
            });
        });
        // Update the tape
        $("#tape-wrapper #start").text(nfa.input.substring(0, nfa.index-1));
        $("#tape-wrapper #middle").text(nfa.input.substring(nfa.index-1, nfa.index));
        $("#tape-wrapper #end").text(nfa.input.substring(nfa.index, nfa.input.length));
    }
    // Check for acceptance or rejection after the step completes
    else if (nfa.status !== "running") {
        $("#stop-simulation").prop("disabled", false);
        $("#start-simulation").prop("disabled", true);
        $("#step-simulation").prop("disabled", true);
        $("#simulation-output").val(nfa.status === "accept" ? "Accepted" : "Rejected");
    }
});

// Save automata to JSON file
$("#toolbox-wrapper").on("click", "#save-automata", function (event) {
    let json = nfa.model.serialize();
    json.states = {};
    $("#diagram").find('div.control').each(function() {
        json.states[this.dataset.stateName] = $(this).position();
    });

    let blob = new Blob([JSON.stringify(json)], {type: "application/json"});
    window.location = window.URL.createObjectURL(blob);
});

async function parseJSONFile(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onload = event => resolve(JSON.parse(event.target.result));
        fileReader.onerror = error => reject(error);
        fileReader.readAsText(file);
    });
}

// Load automata from JSON file
$("#toolbox-wrapper").on("click", "#load-automata", function (event) {
    let input = document.createElement('input');
    input.type = "file";
    input.accept = "application/JSON";
    input.onchange = async function (event) {
        event.preventDefault();
        const json = await parseJSONFile(input.files[0]);
        model.deserialize(json);
        // Place all of the states on the diagram
        Object.keys(json.states).forEach(stateName => {
            let stateElement = createStateElement(uuidv4(), stateName);
            let x = json.states[stateName]["left"];
            let y = json.states[stateName]["top"];
            addStateElementToDiagram(instance, stateElement, x, y);
            // Starting state
            if (stateName === json.startState) {
                stateElement.classList.add("starting");
            }
            // Accepting states
            if (json.acceptStates.indexOf(stateName) > -1) {
                stateElement.classList.add("accepting");
            }
        });
        // Make transitions
        Object.keys(json.transitions).forEach(stateAName => {
            let stateATransitions = {};
            Object.keys(json.transitions[stateAName]).forEach(character => {
                json.transitions[stateAName][character].forEach(stateBName => {
                    if (stateATransitions[stateBName] == null) {
                        stateATransitions[stateBName] = [];
                    }
                    stateATransitions[stateBName].push(character);
                })
            });
            instance.unbind("connection");
            Object.keys(stateATransitions).forEach(stateBName => {
                let characters = stateATransitions[stateBName];
                let stateA = $("#diagram").find(`[data-state-name='${stateAName}']`);
                let stateB = $("#diagram").find(`[data-state-name='${stateBName}']`);
                instance.connect({
                    source: instance.getEndpoints(stateA)[0],
                    target: stateB,
                    paintStyle: { stroke: "#000",  strokeWidth: 2 },
                    hoverPaintStyle: { stroke: "green", strokeWidth: 6 },
                    connector: [ "StateMachine" ],
                    overlays: [
                        [ "Arrow", { location: 1, width: 20, length: 20 } ],
                        [ "Label", { location: 0.5 } ]
                    ]
                }).setLabel(characters.join(","));
            });
            instance.bind("connection", onConnection);
        });
    }
    input.click();
});

instance = jsPlumb.getInstance({});
instance.setContainer("diagram");
instance.registerConnectionTypes({
    "default-connection": {
        paintStyle: { stroke: "#000",  strokeWidth: 2 },
        hoverPaintStyle: { stroke: "green", strokeWidth: 6 },
        connector: [ "StateMachine" ],
        overlays: [
            [ "Arrow", { location: 1, width: 20, length: 20 } ],
            [ "Label", { location: 0.5 } ]
        ]
    }
});

function onConnection (info) {
    let sourceName = info.source.innerText;
    let targetName = info.target.innerText;
    let connection = info.connection;
    let transitionCharacters = prompt("Enter the characters for this transition separated by commas,"
                                    +" using an underscore (_) to represent Epsilon (ε) transitions."
                                    +"\nFor example a,_,b will create a transition for the characters a,ε,b.");
    // TODO: check that a transition does not already exist between these states
    if (transitionCharacters === null || transitionCharacters === "") {
        instance.deleteConnection(connection);
    } else {
        transitionCharacters = transitionCharacters
                                .replace(/[^a-zA-Z0-9_,]/g, "")
                                .replace("_", "ε")
                                .toLowerCase()
                                .split(",")
                                .filter(char => char.length == 1);
        // TODO: filter out duplicate transition characters
        transitionCharacters.forEach(function (character) {
            nfa.model.addTransition(sourceName, character, targetName);
        });
        connection.setLabel(transitionCharacters.join(","));
    }
}
instance.bind("connection", onConnection);

// Transition context menu handler
instance.bind("contextmenu", function (component, event) {
    if (component.hasClass("jtk-connector")) {
        event.preventDefault();
        window.selectedConnection = component;
        $("#state-context-menu").css({display: "none"});
        $("#transition-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
        $("#body-context-menu").css({display: "none"});
    }
});
