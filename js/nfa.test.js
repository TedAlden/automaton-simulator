function runTests() {
    function assert(outcome, description) {
        console.log((outcome ? 'Pass:' : 'FAIL:'), description);
    }

    var model, simulator;

    // create test NFA
    model = new NFAModel();
    model.addTransition('s0', 'a', 's1');
    model.addTransition('s1', 'a', 's2');
    model.addTransition('s1', 'c', 's3');
    model.addTransition('s2', 'b', 's4');
    model.setStartState('s0');
    model.addAcceptState('s3');
    model.addAcceptState('s4');
    
    // run tests
    simulator = new NFASimulator(model);
    assert(simulator.accepts('aab'), 'Accept aab');
    assert(simulator.accepts('ac'), 'Accept ac');
    assert(!simulator.accepts(''), 'Reject empty string');
    assert(!simulator.accepts('a'), 'Reject a');
    assert(!simulator.accepts('aa'), 'Reject aa');
    assert(!simulator.accepts('ab'), 'Reject ab');

    // edit the NFA
    simulator.model.removeTransition('s2', 'b', 's4');
    simulator.model.removeAcceptState('s3');

    // run further tests
    assert(!simulator.accepts('aab'), 'Reject aab');
    assert(!simulator.accepts('ac'), 'Reject ac');

    // create a new test NFA
    model = new NFAModel();
    model.addTransition('s0', 'a', 's1');
    model.addTransition('s1', 'b', 's1');
    model.addTransition('s1', 'b', 's2');
    model.setStartState('s0');
    model.addAcceptState('s2');

    // run tests
    simulator = new NFASimulator(model);
    assert(simulator.accepts('abb'), 'Accept abb');
    assert(simulator.accepts('ab'), 'Accept ab');

    // edit the NFA
    simulator.model.removeTransition('s1', 'b', 's1');

    // run further tests
    assert(!simulator.accepts('abb'), 'Reject abb');
}
