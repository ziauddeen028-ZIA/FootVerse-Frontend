import {
  SUB_MODES,
  calculateTeamSubstitutionState,
  parseSubstitutionEvent,
  formatSubstitutionDetails,
  cleanSubstitutionDetails,
} from './substitutionUtils.js';

function runTests() {
  console.log('--- Starting Substitution Utils Test Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Test failed: ${message}`);
    } else {
      console.log(`✅ PASSED: ${message}`);
      passed++;
    }
  }

  // Sample Squad: 5 players: A, B, C, D, E
  const roster = [
    { playerId: 'p-A', jerseyNumber: 1, player: { id: 'p-A', fullName: 'Player A' } },
    { playerId: 'p-B', jerseyNumber: 2, player: { id: 'p-B', fullName: 'Player B' } },
    { playerId: 'p-C', jerseyNumber: 3, player: { id: 'p-C', fullName: 'Player C' } },
    { playerId: 'p-D', jerseyNumber: 4, player: { id: 'p-D', fullName: 'Player D' } },
    { playerId: 'p-E', jerseyNumber: 5, player: { id: 'p-E', fullName: 'Player E' } },
  ];

  // TEST 1: Initial state for fieldSize 3 (players A, B, C on field; D, E on bench)
  {
    const state = calculateTeamSubstitutionState({
      roster,
      events: [],
      teamId: 'team-1',
      fieldSize: 3,
      substitutionMode: SUB_MODES.NORMAL,
    });

    assert(state.fieldSize === 3, 'Effective field size is 3');
    assert(state.squadSize === 5, 'Squad size is 5');
    assert(state.onFieldPlayerIds.has('p-A') && state.onFieldPlayerIds.has('p-B') && state.onFieldPlayerIds.has('p-C'), 'A, B, C are initially on field');
    assert(!state.onFieldPlayerIds.has('p-D') && !state.onFieldPlayerIds.has('p-E'), 'D, E are initially off field');
    assert(state.eligibleOutMembers.length === 3, '3 eligible OUT members (A, B, C)');
    assert(state.eligibleInMembers.length === 2, '2 eligible IN members (D, E)');
  }

  // TEST 2: Normal substitution (A OUT → D IN). Then A CANNOT return.
  {
    const events = [
      {
        id: 'evt-1',
        teamId: 'team-1',
        eventType: 'substitution',
        playerId: 'p-A',
        minute: 10,
        details: formatSubstitutionDetails({
          outPlayerLabel: '#1 Player A',
          inPlayerLabel: '#4 Player D',
          playerOutId: 'p-A',
          playerInId: 'p-D',
        }),
      },
    ];

    const state = calculateTeamSubstitutionState({
      roster,
      events,
      teamId: 'team-1',
      fieldSize: 3,
      substitutionMode: SUB_MODES.NORMAL,
    });

    assert(!state.onFieldPlayerIds.has('p-A'), 'Player A is no longer on field');
    assert(state.onFieldPlayerIds.has('p-D'), 'Player D is now on field');
    assert(state.onFieldPlayerIds.has('p-B') && state.onFieldPlayerIds.has('p-C'), 'B and C remain on field');
    assert(state.permanentlySubbedOutIds.has('p-A'), 'Player A is marked permanently subbed out');
    assert(!state.offFieldPlayerIds.has('p-A'), 'Player A is NOT available in offField');
    assert(state.eligibleInMembers.length === 1 && state.eligibleInMembers[0].playerId === 'p-E', 'Only Player E is eligible to enter (A cannot return)');
  }

  // TEST 3: Rolling substitution: A OUT → D IN → A can later return (B OUT → A IN)
  {
    // Step 3a: A OUT → D IN
    const events1 = [
      {
        id: 'evt-1',
        teamId: 'team-1',
        eventType: 'substitution',
        playerId: 'p-A',
        minute: 10,
        details: formatSubstitutionDetails({
          outPlayerLabel: '#1 Player A',
          inPlayerLabel: '#4 Player D',
          playerOutId: 'p-A',
          playerInId: 'p-D',
        }),
      },
    ];

    const state1 = calculateTeamSubstitutionState({
      roster,
      events: events1,
      teamId: 'team-1',
      fieldSize: 3,
      substitutionMode: SUB_MODES.ROLLING,
    });

    assert(!state1.onFieldPlayerIds.has('p-A'), 'Rolling: Player A is off the field');
    assert(state1.onFieldPlayerIds.has('p-D'), 'Rolling: Player D is on the field');
    assert(state1.offFieldPlayerIds.has('p-A'), 'Rolling: Player A is in offField set (bench)');
    assert(state1.offFieldPlayerIds.has('p-E'), 'Rolling: Player E is in offField set (bench)');
    assert(state1.eligibleInMembers.some(m => m.playerId === 'p-A'), 'Rolling: Player A CAN be selected as IN player');
    assert(state1.eligibleInMembers.some(m => m.playerId === 'p-E'), 'Rolling: Player E CAN be selected as IN player');
    assert(!state1.eligibleInMembers.some(m => m.playerId === 'p-B' || m.playerId === 'p-C' || m.playerId === 'p-D'), 'Rolling: Players on field (B, C, D) cannot be selected as IN player');

    // Step 3b: B OUT → A IN (Player A returns!)
    const events2 = [
      ...events1,
      {
        id: 'evt-2',
        teamId: 'team-1',
        eventType: 'substitution',
        playerId: 'p-B',
        minute: 25,
        details: formatSubstitutionDetails({
          outPlayerLabel: '#2 Player B',
          inPlayerLabel: '#1 Player A',
          playerOutId: 'p-B',
          playerInId: 'p-A',
        }),
      },
    ];

    const state2 = calculateTeamSubstitutionState({
      roster,
      events: events2,
      teamId: 'team-1',
      fieldSize: 3,
      substitutionMode: SUB_MODES.ROLLING,
    });

    assert(state2.onFieldPlayerIds.has('p-A'), 'Rolling: Player A has re-entered the field');
    assert(!state2.onFieldPlayerIds.has('p-B'), 'Rolling: Player B has left the field');
    assert(state2.onFieldPlayerIds.has('p-C') && state2.onFieldPlayerIds.has('p-D'), 'Rolling: Players C and D remain on field');
    assert(state2.offFieldPlayerIds.has('p-B') && state2.offFieldPlayerIds.has('p-E'), 'Rolling: Players B and E are now on bench');
    assert(state2.eligibleOutMembers.map(m => m.playerId).sort().join(',') === 'p-A,p-C,p-D', 'Eligible OUT members are A, C, D');
    assert(state2.eligibleInMembers.map(m => m.playerId).sort().join(',') === 'p-B,p-E', 'Eligible IN members are B, E');
  }

  // TEST 4: Arbitrary non-hardcoded field sizes (e.g. 7-a-side, 5-a-side, 11-a-side, 2-a-side)
  {
    // Field size 2 with squad 5
    const stateField2 = calculateTeamSubstitutionState({
      roster,
      events: [],
      teamId: 'team-1',
      fieldSize: 2,
      substitutionMode: SUB_MODES.ROLLING,
    });
    assert(stateField2.onFieldPlayerIds.size === 2, 'Field size 2 produces 2 on-field players');
    assert(stateField2.offFieldPlayerIds.size === 3, 'Field size 2 produces 3 off-field players');

    // Field size 6 with squad 5 (squad smaller than field size) -> clamps to 5
    const stateField6 = calculateTeamSubstitutionState({
      roster,
      events: [],
      teamId: 'team-1',
      fieldSize: 6,
      substitutionMode: SUB_MODES.ROLLING,
    });
    assert(stateField6.fieldSize === 5, 'Field size 6 with squad 5 clamps to 5');
    assert(stateField6.onFieldPlayerIds.size === 5, 'All 5 players on field');
    assert(stateField6.offFieldPlayerIds.size === 0, '0 bench players');
    assert(stateField6.eligibleInMembers.length === 0, 'No eligible IN members when entire squad is on field');
  }

  // TEST 5: Red Card / Sent-off player handling
  {
    const sentOffSet = new Set(['p-B']);
    const state = calculateTeamSubstitutionState({
      roster,
      events: [],
      teamId: 'team-1',
      fieldSize: 3,
      substitutionMode: SUB_MODES.ROLLING,
      sentOffPlayerIds: sentOffSet,
    });

    assert(!state.onFieldPlayerIds.has('p-B'), 'Sent-off Player B removed from onField');
    assert(!state.offFieldPlayerIds.has('p-B'), 'Sent-off Player B removed from offField');
    assert(!state.eligibleOutMembers.some(m => m.playerId === 'p-B'), 'Sent-off Player B not in eligible OUT');
    assert(!state.eligibleInMembers.some(m => m.playerId === 'p-B'), 'Sent-off Player B not in eligible IN');
  }

  // TEST 6: Tag cleaning and parsing
  {
    const taggedStr = 'OUT: #1 Player A → IN: #4 Player D (tactical) <!--sub:p-A:p-D-->';
    const cleaned = cleanSubstitutionDetails(taggedStr);
    assert(cleaned === 'OUT: #1 Player A → IN: #4 Player D (tactical)', 'Tag cleaned cleanly');

    const parsed = parseSubstitutionEvent({ eventType: 'substitution', details: taggedStr, playerId: 'p-A' });
    assert(parsed.outPlayerId === 'p-A' && parsed.inPlayerId === 'p-D', 'Parsed tagged sub event correctly');
  }

  console.log(`\n🎉 ALL ${passed}/${total} TESTS PASSED!`);
}

runTests();
