/**
 * Automaton JSON data structure.
 * @typedef {Object} Automaton
 * @property {Object} transitions - The transition table.
 * @property {?String} startState - The starting state.
 * @property {Array} acceptStates - A list of accepting states.
 */

/**
 * Class representing an NFA.
 */
class NFAModel {
    /**
     * Create an NFA data model.
     */
    constructor() {
        this.transitions = {};
        this.startState = null;
        this.acceptStates = [];
    }

    /**
     * Create a transition between two states, reading one character.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     */
    addTransition (stateA, character, stateB) {
        if (!this.transitions[stateA]) {
            this.transitions[stateA] = {};
        }
        if (!this.transitions[stateA][character]) {
            this.transitions[stateA][character] = [];
        }
        this.transitions[stateA][character].push(stateB);
    }

    /**
     * Remove a single character transition between two states.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     */
    removeTransition (stateA, character, stateB) {
        if (this.transitions[stateA] && this.transitions[stateA][character]) {
            let index = this.transitions[stateA][character].indexOf(stateB);
            if (index > -1) {
                this.transitions[stateA][character].splice(index, 1);
            }
        }
    }

    /**
     * Remove all of the transitions in and out of a state.
     * @param {String} state - The name of the source state.
     */
    removeTransitions (state) {
        // Remove transitions coming from this state
        this.transitions[state] = {};
        // Remove transitions going into this state
        Object.keys(this.transitions).forEach(stateA => {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character].indexOf(state) > -1) {
                    this.removeTransition(stateA, character, state);
                }
            });
        });
    }

    /**
     * Check if a transition exists between a source and target state.
     * @param {String} stateA - The name of the source state.
     * @param {String} stateB - The name of the target state.
     * @returns {Boolean} State was found.
     */
    hasTransition (stateA, stateB) {
        let found = false;
        if (this.transitions[stateA] !== null) {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character].indexOf(stateB) > -1) {
                    found = true;
                }
            });
        }
        return found;   
    }

    /**
     * Perform a transition from a source state, reading a character,
     * and return a list of the target state(s).
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @returns {?Array} List of target state(s).
     */
    doTransition (stateA, character) {
        if (this.transitions[stateA]) {
            return this.transitions[stateA][character];
        } else {
            return null;
        }
    }

    /**
     * Mark a state as an accepting state.
     * @param {String} state - The name of the state.
     */
    addAcceptState (state) {
        if (!this.acceptStates.includes(state)) {
            this.acceptStates.push(state);
        }
    }

    /**
     * Mark a state as a non-accepting state.
     * @param {String} state - The name of the state.
     */
    removeAcceptState (state) {
        if (this.acceptStates.includes(state)) {
            let index = this.acceptStates.indexOf(state);
            this.acceptStates.splice(index);
        }
    }

    /**
     * Check if a state is an accepting state.
     * @param {String} state - The name of the state.
     * @returns {Boolean} State is accepting.
     */
    isAcceptState (state) {
        return this.acceptStates.indexOf(state) > -1;
    }

    /**
     * Set the automatons start state to a given state.
     * @param {String} state - The name of the state.
     */
    setStartState (state) {
        this.startState = state;
    }

    /**
     * Serialise the model into a JSON format.
     * @returns {Automaton} JSON object.
     */
    serialize () {
        return {
            transitions: this.transitions,
            acceptStates: this.acceptStates,
            startState: this.startState
        };
    }

    /**
     * Deserialise the model from a JSON format and load it's attributes
     * into the current instance.
     * @param {Automaton} json - The JSON object to load.
     */
    deserialize (json) {
        this.transitions = json.transitions;
        this.acceptStates = json.acceptStates;
        this.startState = json.startState;
    }
}

/**
 * Class containing the code for simulating an NFA.
 */
class NFASimulator {
    /**
     * 
     * @param {NFAModel} model 
     */
    constructor(model) {
        this.model = model;
        this.status = null;
        this.nextStep = null;
        this.input = null;
        this.index = 0;
        this.states = [];
    }

    /**
     * Check if a string is accepted by the NFA.
     * @param {String} input - The input string to test for acceptance.
     * @returns {Boolean} Input string was accepted.
     */
    accepts (input) {
        this.initialize(input);
        while (this.status === "running") {
            this.step();
        }
        return this.status === "accept";
    }

    /**
     * Initialise the simulator with an input.
     * @param {String} input - The input string to simulate.
     */
    initialize (input) {
        this.status = "running";
        this.nextStep = "epsilons";
        this.input = input;
        this.index = 0;
        this.states = [this.model.startState];
    }

    /**
     * Perform one step, either following an epsilon or a symbol
     * transitions, after reading an input symbol. 
     */
    step () {
        if (this.nextStep == "epsilons") {
            let changed = true;
            while (changed) {
                changed = false;
                this.states.forEach(state => {
                    let transitionStates = this.model.doTransition(state, "ε");
                    if (transitionStates) {
                        transitionStates.forEach(transitionState => {
                            let match = false;
                            this.states.forEach(checkState => {
                                if (checkState == transitionState) {
                                    match = true;
                                    return false;
                                }
                            });
                            if (!match) {
                                changed = true;
                                this.states.push(transitionState);
                            }
                        });
                    }
                });
            }
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
