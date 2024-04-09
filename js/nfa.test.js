function runTests() {
    function assert(outcome, description) {
        console.log((outcome ? 'Pass:' : 'FAIL:'), description);
    }

    // create test NFA
    var testNFA = new NFA()
    testNFA.addTransition('s0', 'a', 's1')
    testNFA.addTransition('s1', 'a', 's2')
    testNFA.addTransition('s1', 'c', 's3')
    testNFA.addTransition('s2', 'b', 's4')
    testNFA.setStartState('s0');
    testNFA.addAcceptState('s3');
    testNFA.addAcceptState('s4');
    
    // run tests
    assert(testNFA.accepts('aab'), 'Accept aab');
    assert(testNFA.accepts('ac'), 'Accept ac');
    assert(!testNFA.accepts(''), 'Reject empty string');
    assert(!testNFA.accepts('a'), 'Reject a');
    assert(!testNFA.accepts('aa'), 'Reject aa');
    assert(!testNFA.accepts('ab'), 'Reject ab');
}
