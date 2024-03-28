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
        endpoint: [
            "Dot",
            {
                radius:7
            }
        ],
        anchor: ["RightMiddle"],
        maxConnections: -1,
        isSource: true,
        connectionType: "default-connection"
    });
    instance.addEndpoint(state.id, {
        endpoint: [
            "Dot",
            {
                radius:7
            }
        ],
        anchor: ["LeftMiddle"],
        maxConnections: -1,
        isTarget: true,
        connectionType: "default-connection"
    });
    numStates++;
}

var stateContextMenu = document.getElementById('state-context-menu');
var transitionContextMenu = document.getElementById('transition-context-menu');
var bodyContextMenu = document.getElementById('body-context-menu');
var numStates = 0;

var model = new NFA();

instance = jsPlumb.getInstance({});
instance.setContainer("diagram");

instance.registerConnectionTypes({
    "default-connection": {
        // anchor:[ "Perimeter", { shape:"Circle"} ],
        // anchor: ["AutoDefault"],
        paintStyle: {
            stroke: "#000", /* rgb(68, 85, 102) */
            strokeWidth: 2
        },
        hoverPaintStyle: {
            stroke: "green",
            strokeWidth: 6
        },
        connector: [
            "StateMachine",
            {
                curviness: -20
            }
        ],
        overlays: [
            [
                "Arrow", 
                {
                    location: 1,
                    width: 20,
                    length: 20,
                }
            ],
            [
                "Label",
                {
                    location: 0.5
                }
            ]
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

instance.bind("ready", function () {
    // Create an initial starting state
    const state1 = createStateElement(uuidv4(), "s"+numStates);
    addStateElementToDiagram(instance, state1, 100, 100);

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
    
    // State context menu handler
    $("body").on("contextmenu", "#diagram .control", function (event) {
        event.preventDefault();
        window.selectedControl = $(this).attr("id");
        stateContextMenu.style.left = event.pageX + 'px'
        stateContextMenu.style.top = event.pageY + 'px'
        stateContextMenu.style.display = 'block'
        transitionContextMenu.style.display = "none";
        bodyContextMenu.style.display = "none";
    });

    // Default context menu handler
    $("body").on("contextmenu", function (event) {
        if (event.target.id == "diagram") {
            event.preventDefault();
            bodyContextMenu.style.left = event.pageX + 'px'
            bodyContextMenu.style.top = event.pageY + 'px'
            bodyContextMenu.style.display = 'block'
            transitionContextMenu.style.display = "none";
            stateContextMenu.style.display = "none";
        }
    });

    $(document).bind("click", function (event) {
        $("div.custom-menu").remove();
        stateContextMenu.style.display = 'none'
        transitionContextMenu.style.display = "none";
        bodyContextMenu.style.display = "none";
    });

    $("body").on("click", ".delete-state", function (event) {
        instance.remove(window.selectedControl);
    });

    $("body").on("click", ".rename-state", function (event) {
        prompt("Rename state");
    });

    $("body").on("click", ".toggle-accepting-state", function (event) {
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

    $("body").on("click", ".make-starting-state", function (event) {
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

    $("body").on("click", ".delete-transition", function (event) {
        instance.deleteConnection(window.selectedConnection);
    });

    $("body").on("click", ".edit-transition", function (event) {
        prompt("Edit transitions.");
    });

    $("body").on("click", ".create-control", function (event) {
        let rect = instance.getContainer().getBoundingClientRect();
        let x = event.pageX - rect.left;
        let y = event.pageY - rect.top;
        const state = createStateElement(uuidv4(), "s"+numStates);
        addStateElementToDiagram(instance, state, x, y);
    });
});