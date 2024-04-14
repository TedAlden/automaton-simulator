class NFAModel {
    constructor() {
        this.transitions = {};
        this.startState = null;
        this.acceptStates = [];
    }

    addTransition (stateA, character, stateB) {
        if (!this.transitions[stateA]) {
            this.transitions[stateA] = {};
        }
        if (!this.transitions[stateA][character]) {
            this.transitions[stateA][character] = [];
        }
        this.transitions[stateA][character].push(stateB);
    }

    removeTransition (stateA, character, stateB) {

    }

    removeTransitions (state) {

    }

    isTransition (stateA, character, stateB) {
        
    }

    doTransition (stateA, character) {
        if (this.transitions[stateA]) {
            return this.transitions[stateA][character];
        } else {
            return null;
        }
    }

    addAcceptState (state) {
        if (!this.acceptStates.includes(state)) {
            this.acceptStates.push(state);
        }
    }

    removeAcceptState (state) {
        if (this.acceptStates.includes(state)) {
            let index = this.acceptStates.indexOf(state);
            this.acceptStates.splice(index);
        }
    }

    isAcceptState (state) {
        return this.acceptStates.indexOf(state) > -1;
    }

    setStartState (state) {
        this.startState = state;
    }

    serialize () {

    }

    deserialize () {

    }
}

class NFASimulator {
    constructor(model) {
        this.model = model;
        this.status = null;
        this.nextStep = null;
        this.input = null;
        this.index = 0;
        this.states = [];
    }

    accepts (input) {
        this.initialize(input);
        while (this.status === "running") {
            this.step();
        }
        return this.status === "accept";
    }

    initialize (input) {
        this.status = "running";
        this.nextStep = "epsilons";
        this.input = input;
        this.index = 0;
        this.states = [this.model.startState];
    }

    step () {
        if (this.nextStep == "epsilons") {

            /// TODO:...

            this.nextStep = "input";
        } else if (this.nextStep == "input") {
            let newStates = [];
            let char = this.input.substr(this.index, 1);
            let state = null;
            while (state = this.states.shift()) {
                let transitionStates = this.model.doTransition(state, char);
                if (transitionStates) {
                    transitionStates.forEach(transitionState => {
                        if (newStates.indexOf(transitionState) == -1) {
                            newStates.push(transitionState);
                        }
                    });
                }
            }
            this.index++;
            this.states = newStates;
            this.nextStep = "epsilons";
        }
        if (this.states.length == 0) {
            this.status = "reject";
        }
        if (this.index === this.input.length) {
            this.states.forEach(state => {
                if (this.model.isAcceptState(state)) {
                    this.status = "accept";
                    return;
                }
            });
        }
    } 
}
