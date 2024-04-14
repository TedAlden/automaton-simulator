function runTests() {
    function assert(outcome, description) {
        console.log((outcome ? 'Pass:' : 'FAIL:'), description);
    }

    // create test NFA
    let model = new NFAModel();
    model.addTransition('s0', 'a', 's1');
    model.addTransition('s1', 'a', 's2');
    model.addTransition('s1', 'c', 's3');
    model.addTransition('s2', 'b', 's4');
    model.setStartState('s0');
    model.addAcceptState('s3');
    model.addAcceptState('s4');
    
    // run tests
    let simulator = new NFASimulator(model);
    assert(simulator.accepts('aab'), 'Accept aab');
    assert(simulator.accepts('ac'), 'Accept ac');
    assert(!simulator.accepts(''), 'Reject empty string');
    assert(!simulator.accepts('a'), 'Reject a');
    assert(!simulator.accepts('aa'), 'Reject aa');
    assert(!simulator.accepts('ab'), 'Reject ab');
}
