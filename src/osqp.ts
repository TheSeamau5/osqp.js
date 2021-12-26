import Module from "./osqp.wasm";

import { CSCMatrix, OSQP_C_Module, SettingsConfig, LinsysSolver, OSQPErrorType } from './types';


// There should only be one shared C module
let c_module: OSQP_C_Module;
const NUM_BYTES_DOUBLE = 8;
const NUM_BYTES_INT = 4;

// Helper function to get string for a given error message
function str_osqp_error_message(exit_code: OSQPErrorType): string {
    switch (exit_code) {
        case OSQPErrorType.NO_ERROR:
            return 'No Error';

        case OSQPErrorType.OSQP_DATA_VALIDATION_ERROR:
            return 'Data Validation Error'

        case OSQPErrorType.OSQP_SETTINGS_VALIDATION_ERROR:
            return 'Settings Validation Error'

        case OSQPErrorType.OSQP_LINSYS_SOLVER_LOAD_ERROR:
            return 'Linsys Solver Load Error'

        case OSQPErrorType.OSQP_LINSYS_SOLVER_INIT_ERROR:
            return 'Linsys Solver Initialization Error'

        case OSQPErrorType.OSQP_NONCVX_ERROR:
            return 'Non CVX Error'

        case OSQPErrorType.OSQP_MEM_ALLOC_ERROR:
            return 'Memory Allocation Error'

        case OSQPErrorType.OSQP_WORKSPACE_NOT_INIT_ERROR:
            return 'Workspace Not Initialized'

        default:
            return 'Unknown Error'
    }
}

// Helper function to create a CSC Matrix pointer
function create_csc_pointer(csc: CSCMatrix, n_rows: number, n_columns: number) {
    // Data Pointer
    const data_pointer = c_module._malloc(
        csc.data.length * NUM_BYTES_DOUBLE
    );

    c_module.HEAPF64.set(
        csc.data,
        data_pointer / NUM_BYTES_DOUBLE
    );

    // Row indices
    const row_indices_pointer = c_module._malloc(
        csc.row_indices.length * NUM_BYTES_INT
    );

    c_module.HEAP32.set(
        csc.row_indices,
        row_indices_pointer / NUM_BYTES_INT
    );

    const column_pointers_pointer = c_module._malloc(
        csc.column_pointers.length * NUM_BYTES_INT
    );

    c_module.HEAP32.set(
        csc.column_pointers,
        column_pointers_pointer / NUM_BYTES_INT
    )

    return c_module._create_csc_matrix(
        n_rows,
        n_columns,
        csc.data.length,
        data_pointer,
        row_indices_pointer,
        column_pointers_pointer
    );

}


function create_double_array_pointer(array: ArrayLike<number>) {
    const data = Float64Array.from(array);

    const data_ptr = c_module._malloc(
        data.length * NUM_BYTES_DOUBLE
    );

    c_module.HEAPF64.set(
        data,
        data_ptr / NUM_BYTES_DOUBLE
    );

    return data_ptr;
}

export interface SetupOptions {
    P: CSCMatrix,
    A: CSCMatrix,
    q: ArrayLike<number>,
    l: ArrayLike<number>,
    u: ArrayLike<number>
}

// Only support q, l, u for now
export interface UpdateOptions {
    q?: ArrayLike<number>,
    l?: ArrayLike<number>,
    u?: ArrayLike<number>
}


export const SettingsDefault: SettingsConfig = {
    rho: 0.1,
    sigma: 1e-6,
    max_iter: 4000,
    eps_abs: 1e-3,
    eps_rel: 1e-3,
    eps_prim_inf: 1e-4,
    eps_dual_inf: 1e-4,
    alpha: 1.6,
    linsys_solver: LinsysSolver.QDLDL_SOLVER,
    delta: 1e-6,
    polish: false,
    polish_refine_iter: 3,
    verbose: true,
    scaled_termination: false,
    check_termination: 25,
    warm_start: true,
    time_limit: 0,
};


export default class OSQP {

    _state: any;

    private constructor() { }

    // Setup a problem
    static async setup(options: SetupOptions, settings: SettingsConfig = {}): Promise<OSQP> {
        if (!c_module) {
            c_module = await Module();
        }

        const { P, A, q, l, u } = options;

        const n = q.length; // number of variables
        const m = l.length; // number of constraints

        const pointer_to_P = create_csc_pointer(P, n, n);
        const pointer_to_A = create_csc_pointer(A, m, n);




        const pointer_to_q = create_double_array_pointer(q);
        const pointer_to_l = create_double_array_pointer(l);
        const pointer_to_u = create_double_array_pointer(u);

        // Create the data
        const pointer_to_data = c_module._create_data(
            m, n,
            pointer_to_P,
            pointer_to_A,
            pointer_to_q,
            pointer_to_l,
            pointer_to_u
        );

        // Create the settings
        const _settings = { ...SettingsDefault, settings };
        const pointer_to_settings = c_module._create_settings(
            _settings.rho,
            _settings.sigma,
            _settings.max_iter,
            _settings.eps_abs,
            _settings.eps_rel,
            _settings.eps_dual_inf,
            _settings.eps_dual_inf,
            _settings.alpha,
            _settings.linsys_solver,
            _settings.delta,
            _settings.polish,
            _settings.polish_refine_iter,
            _settings.verbose,
            _settings.scaled_termination,
            _settings.check_termination,
            _settings.warm_start,
            _settings.time_limit
        );


        // Pointer to workspace
        const double_pointer_to_workspace = c_module._malloc(NUM_BYTES_INT)

        // Goal is to call osqp setup
        const exit_code = c_module._osqp_setup(
            double_pointer_to_workspace,
            pointer_to_data,
            pointer_to_settings
        );

        if (exit_code !== OSQPErrorType.NO_ERROR) {
            throw new Error(
                str_osqp_error_message(exit_code)
            );
        }

        // Get simple pointer to workspace
        const pointer_to_workspace = c_module.getValue(
            double_pointer_to_workspace,
            "i32"
        );

        // Create a new OSQP and keep track of state
        const osqp = new OSQP();
        osqp._state = {
            pointer_to_workspace,
            pointer_to_data,
            pointer_to_settings,

            pointer_to_P,
            pointer_to_A,
            pointer_to_q,
            pointer_to_l,
            pointer_to_u,

            l, u,


            num_variables: n
        };
        return osqp;
    }

    // Update a problem 
    update(options: UpdateOptions) {
        const { pointer_to_workspace } = this._state;

        if (options.hasOwnProperty('q')) {
            const { pointer_to_q } = this._state;
            const { q } = options;

            c_module.HEAPF64.set(
                Float64Array.from(q),
                pointer_to_q / NUM_BYTES_DOUBLE
            );

            c_module._osqp_update_lin_cost(
                pointer_to_workspace,
                pointer_to_q
            );
        }

        if (options.hasOwnProperty('l') || options.hasOwnProperty('u')) {
            const { pointer_to_l, pointer_to_u } = this._state;

            const l = options.hasOwnProperty('l') ? options.l : this._state.l;
            const u = options.hasOwnProperty('u') ? options.u : this._state.u;


            c_module.HEAPF64.set(
                l,
                pointer_to_l / NUM_BYTES_DOUBLE
            );

            c_module.HEAPF64.set(
                u,
                pointer_to_u / NUM_BYTES_DOUBLE
            );

            c_module._osqp_update_bounds(
                pointer_to_workspace,
                pointer_to_l,
                pointer_to_u
            );

            this._state.l = l;
            this._state.u = u;
        }

    }

    // Solve the problem
    solve() {
        const { pointer_to_workspace, num_variables } = this._state;

        const pointer_to_solution = c_module._solve_problem(pointer_to_workspace)

        const solution = new Float64Array(num_variables);

        // Copy the data from the pointer into the vector
        const pointer_start = pointer_to_solution / NUM_BYTES_DOUBLE;
        solution.set(
            c_module.HEAPF64.subarray(pointer_start, pointer_start + num_variables)
        );

        return solution;
    }

    // Cleanup (Free C memory)
    cleanup() {
        const {
            pointer_to_workspace,
            pointer_to_data,
            pointer_to_settings
        } = this._state;

        c_module._osqp_cleanup(pointer_to_workspace);
        c_module._cleanup_data(pointer_to_data);
        c_module._cleanup_settings(pointer_to_settings);
    }
}
