# Javascript Interface for OSQP

Javascript wrapper for [OSQP](https://osqp.org/)


### Example

```ts
import OSQP from 'osqp'

async function main() {
    /* Define the problem */
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

    /* Setup the solver */
    const solver = await OSQP.setup({
        P, A, q, l, u
    });

    /* Solve the problem */
    const solution = solver.solve();
    console.log(solution);

    /* Update the problem */
    solver.update({
        q: new Float64Array([2.0, 2.0])
    });
    const solution_new = solver.solve();
    console.log(solution_new);

    /* Cleanup when done */
    solver.cleanup() // Frees up memory allocated

}


main();
```