/// <reference types="emscripten" />

export enum LinsysSolver {
    QDLDL_SOLVER = 0,
    MKL_PARDISO_SOLVER = 1,
}

export enum OSQPErrorType {
    NO_ERROR,
    OSQP_DATA_VALIDATION_ERROR,
    OSQP_SETTINGS_VALIDATION_ERROR,
    OSQP_LINSYS_SOLVER_LOAD_ERROR,
    OSQP_LINSYS_SOLVER_INIT_ERROR,
    OSQP_NONCVX_ERROR,
    OSQP_MEM_ALLOC_ERROR,
    OSQP_WORKSPACE_NOT_INIT_ERROR
}


export interface SettingsConfig {
    rho?: number;
    sigma?: number;
    max_iter?: number;
    eps_abs?: number;
    eps_rel?: number;
    eps_prim_inf?: number;
    eps_dual_inf?: number;
    alpha?: number;
    linsys_solver?: LinsysSolver;
    delta?: number;
    polish?: boolean;
    polish_refine_iter?: number;
    verbose?: boolean;
    scaled_termination?: boolean;
    check_termination?: number;
    warm_start?: boolean;
    time_limit?: number;
}

export interface CSCMatrix {
    data: Float64Array;
    row_indices: Int32Array;
    column_pointers: Int32Array;
}

export interface CSCMatrixPointers {
    // Direct pointer
    ptr?: number;

    // **CSC
    ptr_ptr: number;

    // csc->x
    data_ptr: number;

    // csc->i
    row_indices_ptr: number;

    // csc->p
    column_pointers_ptr: number;
}

export interface SolverPointers {
    A: CSCMatrixPointers;
    P: CSCMatrixPointers;

    q_ptr: number;
    l_ptr: number;
    u_ptr: number;

    settings_ptr: number;
    data_ptr?: number;
}

export interface OSQP_C_Module extends EmscriptenModule {
    /* ****************** */
    /* Explicit Interface */
    /* ****************** */

    // Solve a problem (Returns the solution)
    _solve_problem(workspace: number): number;

    // Create the data
    _create_data(
        m: number, n: number,
        P: number, A: number,
        q: number, l: number, u: number
    ): number;

    // Free the data memory
    _cleanup_data(data: number): void;

    // Create the settings object
    _create_settings(
        rho: number,
        sigma: number,
        max_iter: number,
        eps_abs: number,
        eps_rel: number,
        eps_prim_inf: number,
        eps_dual_inf: number,
        alpha: number,
        linsys_solver: LinsysSolver,
        delta: number,
        polish: boolean,
        polish_refine_iter: number,
        verbose: boolean,
        scaled_termination: boolean,
        check_termination: number,
        warm_start: boolean,
        time_limit: number
    ): number;

    // Free the settings memory
    _cleanup_settings(settings: number): void;

    // Create a CSC Matrix
    _create_csc_matrix(
        m: number,
        n: number,
        nzmax: number,
        x: number,
        i: number,
        p: number
    ): number;

    /* *********************** */
    /* OSQP Functions Exported */
    /* *********************** */

    _osqp_setup(workp: number, data: number, settings: number): OSQPErrorType;

    _osqp_update_lin_cost(work: number, q_new: number): OSQPErrorType;

    _osqp_update_bounds(work: number, l_new: number, u_new: number): OSQPErrorType;

    _osqp_update_P(work: number, Px_new: number, Px_new_idx: number, P_new_n: number): number;

    _osqp_update_A(work: number, Ax_new: number, Ax_new_idx: number, A_new_n: number): number;

    _osqp_cleanup(work: number): OSQPErrorType;
    /* ********* */
    /* C Methods */
    /* ********* */

    // Access memory
    getValue(ptr: number, type: Emscripten.CType): number;






}