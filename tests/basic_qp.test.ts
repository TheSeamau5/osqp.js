import { expect } from 'chai';

import OSQP from '../src/osqp';

function expect_arrays_close(array1: ArrayLike<number>, array2: ArrayLike<number>, delta = 0.00001) {
    expect(array1).to.have.length(array2.length);
    for (let i = 0; i < array1.length; i++) {
        expect(array1[i]).to.be.closeTo(array2[i], delta)
    }
}


describe('Simple QP problem', () => {

    let solver: OSQP;

    const solver_options = {
        verbose: false,
        polish: true
    };

    const P = {
        data: new Float64Array([4.0, 1.0, 2.0]),
        row_indices: new Int32Array([0, 0, 1]),
        column_pointers: new Int32Array([0, 1, 3]),
    };

    const A = {
        data: new Float64Array([1.0, 1.0, 1.0, 1.0]),
        row_indices: new Int32Array([0, 1, 0, 2]),
        column_pointers: new Int32Array([0, 2, 4]),
    };

    const q = new Float64Array([1.0, 1.0]);
    const l = new Float64Array([1.0, 0.0, 0.0]);
    const u = new Float64Array([1.0, 0.7, 0.7]);


    before(async () => {
        solver = await OSQP.setup({
            P, A, q, l, u
        }, solver_options);
        return solver;
    });


    it('should solve the simple problem', () => {
        const solution = solver.solve();
        expect(solution).to.be.instanceOf(Float64Array);

        expect_arrays_close(solution, [0.3, 0.7]);
    });


    it('should still work after cleanup then setup again', async () => {
        // Cleanup the solver
        solver.cleanup();

        // Setup again
        solver = await OSQP.setup({
            P, A, q, l, u
        }, solver_options);

        const solution = solver.solve();
        expect(solution).to.be.instanceOf(Float64Array);

        expect_arrays_close(solution, [0.3, 0.7]);
    });

    const N_ITERATIONS = 10000;
    it(`should run ${N_ITERATIONS} times without crashing`, () => {
        for (let i = 0; i < N_ITERATIONS; i++) {
            expect(() => {
                // Update q
                const q_new = new Float64Array([1.0 + (i / N_ITERATIONS), 1.0 + (i / N_ITERATIONS)]);

                solver.update({ q: q_new });
                const solution = solver.solve();

                expect(solution).to.be.instanceOf(Float64Array);
                expect(solution).to.have.length(2);
            }).not.to.throw();
        }
    });


    // Cleanup after
    after(() => {
        solver.cleanup();
    })

});
