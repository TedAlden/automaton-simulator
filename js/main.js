var stateContextMenu = document.getElementById('state-context-menu');
var transitionContextMenu = document.getElementById('transition-context-menu');
var bodyContextMenu = document.getElementById('body-context-menu');
var numStates = 0;
var model = new NFA();

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
    state.style.left = `${x}px`;
    state.style.top = `${y}px`;
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
    stateContextMenu.style.left = event.pageX + 'px'
    stateContextMenu.style.top = event.pageY + 'px'
    stateContextMenu.style.display = 'block'
    transitionContextMenu.style.display = "none";
    bodyContextMenu.style.display = "none";
});

// Background context menu handler
$("#diagram").on("contextmenu", function (event) {
    if (event.target.id == "diagram") {
        event.preventDefault();
        bodyContextMenu.style.left = event.pageX + 'px'
        bodyContextMenu.style.top = event.pageY + 'px'
        bodyContextMenu.style.display = 'block'
        transitionContextMenu.style.display = "none";
        stateContextMenu.style.display = "none";
    }
});

// Hide context menus when anywhere is left clicked
$(document).bind("click", function (event) {
    $("div.custom-menu").remove();
    stateContextMenu.style.display = 'none'
    transitionContextMenu.style.display = "none";
    bodyContextMenu.style.display = "none";
});

// Context menu -> Delete state
$(".context-menu").on("click", ".delete-state", function (event) {
    instance.remove(window.selectedControl);
});

// Context menu -> Rename state
$(".context-menu").on("click", ".rename-state", function (event) {
    prompt("Rename state");
});

// Context menu -> Toggle accepting state
$(".context-menu").on("click", ".toggle-accepting-state", function (event) {
    let state = document.getElementById(window.selectedControl);
    let stateName = state.innerHTML;
    if (model.acceptStates.includes(stateName)) {
        state.classList.remove("accepting");
        model.acceptStates.splice(model.acceptStates.indexOf(stateName));
    } else {
        state.classList.add("accepting");
        model.acceptStates.push(stateName);
    }
});

// Context menu -> Make starting state
$(".context-menu").on("click", ".make-starting-state", function (event) {
    let oldStart = document.querySelector(`[data-state-name='${model.startState}']`);
    let state = document.getElementById(window.selectedControl);
    let stateName = state.innerHTML;
    if (!state.classList.contains("starting")) {
        state.classList.add("starting");
        model.setStartState(stateName);
        if (oldStart !== null) {
            oldStart.classList.remove("starting");
        }
    }
});

// Context menu -> Delete transition
$(".context-menu").on("click", ".delete-transition", function (event) {
    instance.deleteConnection(window.selectedConnection);
});

// Context menu -> Edit transition
$(".context-menu").on("click", ".edit-transition", function (event) {
    let sourceName = window.selectedConnection.source.dataset.stateName;
    let targetName = window.selectedConnection.target.dataset.stateName;
    let characters = [];
    for (character in model.transitions[sourceName]) {
        if (model.transitions[sourceName][character].includes(targetName)) {
            characters.push(character);
        }
    }
    prompt("Edit transitions.", characters.join(","));
    // TODO: Update the transitions in the model
    // ...
    // TODO: Update the connection label
    // ...
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
    outputBox.val(model.accepts(string) ? "Accepted" : "Rejected");
});

instance = jsPlumb.getInstance({});
instance.setContainer("diagram");
instance.registerConnectionTypes({
    "default-connection": {
        paintStyle: { stroke: "#000",  strokeWidth: 2 },
        hoverPaintStyle: { stroke: "green", strokeWidth: 6 },
        connector: [ "StateMachine", { curviness: -20 } ],
        overlays: [
            [ "Arrow", { location: 1, width: 20, length: 20 } ],
            [ "Label", { location: 0.5 } ]
        ]
    }
});

instance.bind("connection", function (info) {
    let sourceName = info.source.innerText;
    let targetName = info.target.innerText;
    let connection = info.connection;
    let transitionCharacters = prompt("Enter the characters for this transition separated by commas.");
    // TODO: check that a transition does not already exist between these states
    if (transitionCharacters === null || transitionCharacters === "") {
        instance.deleteConnection(connection);
    } else {
        transitionCharacters = transitionCharacters
                                .replace(/[^a-zA-Z0-9,]/g, "")
                                .toLowerCase()
                                .split(",")
                                .filter(char => char.length == 1);
        // TODO: filter out duplicate transition characters
        transitionCharacters.forEach(function (character) {
            model.addTransition(sourceName, character, targetName);
        });
        connection.setLabel(transitionCharacters.join(","));
    }
});

// Transition context menu handler
instance.bind("contextmenu", function (component, event) {
    if (component.hasClass("jtk-connector")) {
        event.preventDefault();
        window.selectedConnection = component;
        transitionContextMenu.style.left = event.pageX + 'px'
        transitionContextMenu.style.top = event.pageY + 'px'
        transitionContextMenu.style.display = 'block'
        stateContextMenu.style.display = "none";
        bodyContextMenu.style.display = "none";
    }
});

instance.bind("ready", function () {
    // Create an initial starting state
    let stateName = "s" + numStates;
    const state1 = createStateElement(uuidv4(), stateName);
    addStateElementToDiagram(instance, state1, 100, 100);
    state1.classList.add("starting")
    model.setStartState(stateName);
});

