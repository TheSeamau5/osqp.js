import * as mocha from 'mocha';

// Setup Mocha
mocha.setup('bdd');

// Define Local tests (add new tests here)
const LOCAL_TESTS = [
    import('./basic_qp.test')
];

// Run tests
async function run_tests() {
    // Import local tests
    await Promise.all(LOCAL_TESTS);

    // Run the tests
    mocha.run();
}


run_tests();