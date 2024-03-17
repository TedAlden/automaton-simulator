// https://stackoverflow.com/a/2117523
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


var stateContextMenu = document.getElementById('state-context-menu');
var transitionContextMenu = document.getElementById('transition-context-menu');
var bodyContextMenu = document.getElementById('body-context-menu');
var numStates = 2;

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
                    location: 0.99,
                    width: 20,
                    length:20,
                }
            ]
        ]
    }
});

instance.bind("ready", function () {
    instance.draggable("control1", { containment: true })
    instance.draggable("control2", { containment: true })
    instance.addEndpoint("control1", {
        endpoint: [
            "Dot",
            {
                radius:6
            }
        ],
        anchor: ["RightMiddle"],
        isSource: true,
        connectionType: "default-connection",
        maxConnections: -1
    });
    instance.addEndpoint("control1", {
        endpoint: [
            "Dot",
            {
                radius:6
            }
        ],
        anchor: ["LeftMiddle"],
        maxConnections: -1,
        isTarget: true,
        connectionType: "default-connection"
    });
    instance.addEndpoint("control2", {
        endpoint: [
            "Dot",
            {
                radius:6
            }
        ],
        anchor: ["RightMiddle"],
        isSource: true,
        connectionType: "default-connection",
        maxConnections: -1
    });
    instance.addEndpoint("control2", {
        endpoint: [
            "Dot",
            {
                radius:6
            }
        ],
        anchor: ["LeftMiddle"],
        maxConnections: -1,
        isTarget: true,
        connectionType: "default-connection",
        maxConnections: -1
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

    // $("body").on("contextmenu", "#diagram .jtk-connector", function (event) {
    //     event.preventDefault();
    //     window.selectedConnection = $(this).attr("id");
    //     transitionContextMenu.style.left = event.pageX + 'px'
    //     transitionContextMenu.style.top = event.pageY + 'px'
    //     transitionContextMenu.style.display = 'block'
    //     stateContextMenu.style.display = "none";
    //     bodyContextMenu.style.display = "none";
    // });
    // Can't use this approach, since the connections that are made from drag
    // and drop do not have an ID, so there is no way of identifying them.
    // So we have to use the method above that has the 'component' passed to it
    
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
        document.getElementById(window.selectedControl).classList.toggle("accepting");
        console.log(window.selectedControl)
    });

    $("body").on("click", ".make-starting-state", function (event) {
        document.getElementById(window.selectedControl).classList.add("starting")
        console.log(window.selectedControl)
    });

    $("body").on("click", ".delete-transition", function (event) {
        instance.deleteConnection(window.selectedConnection);
        console.log(window.selectedConnection)
    });

    $("body").on("click", ".edit-transition", function (event) {
        prompt("Edit transitions.");
    });

    $("body").on("click", ".create-control", function (event) {
        let rect = instance.getContainer().getBoundingClientRect();
        let x = event.pageX - rect.left;
        let y = event.pageY - rect.top;

        const el = document.createElement('div')
        el.id = uuidv4()

        const handleEl = document.createElement('div')
        handleEl.innerText = "s" + numStates;
        el.appendChild(handleEl)

        el.className += "control"

        el.style.position = 'absolute'
        el.style.left = `${x}px`
        el.style.top = `${y}px`

        numStates++;

        // append this new state element to the jsplumb canvas
        instance.getContainer().appendChild(el)
        instance.draggable(el.id, { "containment": true });
        instance.addEndpoint(el.id, {
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

        instance.addEndpoint(el.id, {
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
    });
});