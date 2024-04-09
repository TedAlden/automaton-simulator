function NFA () {
    this.transitions = {};
    this.startState = null;
    this.acceptStates = [];

    this.simulator = {
        status: null, // "running", "accepted", "rejected"
        nextStep: null,
        input: null,
        index: 0,
        states: []
    }
}

NFA.prototype.accepts = function (input) {
    this.initializeSimulator(input);
    while (this.simulator.status === "running") {
        this.step();
    }
    return this.simulator.status === "accept";
}

NFA.prototype.initializeSimulator = function (input) {
    this.simulator.status = "running";
    this.simulator.nextStep = "epsilons";
    this.simulator.input = input;
    this.simulator.index = 0; // index of current character in input
    this.simulator.states = [this.startState];
}

NFA.prototype.step = function () {
    // finish checking epsilon transitions before checking character transitions
    if (this.simulator.nextStep == "epsilons") {

        ///

        this.simulator.nextStep = "input";
    } else if (this.simulator.nextStep == "input") {
        let newStates = [];
        let char = this.simulator.input.substr(this.simulator.index, 1);
        let state = null;
        while (state = this.simulator.states.shift()) {
            let transitionStates = this.transition(state, char);
            if (transitionStates) {
                transitionStates.forEach(transitionState => {
                    if (newStates.indexOf(transitionState) == -1) {
                        newStates.push(transitionState);
                    }
                });
            }
        }
        ++this.simulator.index;
        this.simulator.states = newStates;
        this.simulator.nextStep = "epsilons";
    }
    if (this.simulator.states.length == 0) {
        this.simulator.status = "reject";
    }
    if (this.simulator.index === this.simulator.input.length) {
        this.simulator.states.forEach(state => {
            if (this.acceptStates.indexOf(state) > -1) {
                this.simulator.status = "accept";
                return;
            }
        });
    }
}

NFA.prototype.setStartState = function (state) {
    this.startState = state;
}

NFA.prototype.addAcceptState = function (state) {
    if (!this.acceptStates.includes(state)) {
        this.acceptStates.push(state);
    }
}

NFA.prototype.removeAcceptState = function (state) {
    if (this.acceptStates.includes(state)) {
        let index = this.acceptStates.indexOf(state);
        this.acceptStates.splice(index);
    }
}

NFA.prototype.isAcceptState = function (state) {
    
}

NFA.prototype.addTransition = function (stateA, character, stateB) {
    if (!this.transitions[stateA]) {
        this.transitions[stateA] = {};
    }
    if (!this.transitions[stateA][character]) {
        this.transitions[stateA][character] = [];
    }
    this.transitions[stateA][character].push(stateB);
}

NFA.prototype.removeTransition = function (stateA, character, stateB) {

}

NFA.prototype.isTransition = function (stateA, character, stateB) {

}

NFA.prototype.transition = function(stateA, character) {
    if (this.transitions[stateA]) {
        return this.transitions[stateA][character];
    } else {
        return null;
    }
}

NFA.prototype.serialize = function () {

}

NFA.prototype.deserialize = function () {

}
