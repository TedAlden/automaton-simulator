function NFA () {
    this.transitions = {};
    this.startState = null;
    this.acceptStates = [];

    this.simulator = {
        status: null, // "running" or "accepted"
        nextStep: null,
        input: null,
    }
}

NFA.prototype.accepts = function (input) {

}

NFA.prototype.step = function () {

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

NFA.prototype.hasTransition = function (stateA, character, stateB) {

}

NFA.prototype.serialize = function () {

}

NFA.prototype.deserialize = function () {

}
