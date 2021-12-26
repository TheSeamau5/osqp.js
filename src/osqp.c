#include <emscripten.h>
#include "../osqp/include/osqp.h"

EMSCRIPTEN_KEEPALIVE
c_float *solve_problem(OSQPWorkspace *workspace)
{
    c_float *solution;
    if (workspace)
    {
        // Call the solver
        osqp_solve(workspace);

        // Get the solution
        solution = workspace->solution->x;
    }
    return solution;
}

EMSCRIPTEN_KEEPALIVE
OSQPData *create_data(c_int m,
                      c_int n,
                      csc *P,
                      csc *A,
                      c_float *q,
                      c_float *l,
                      c_float *u)
{
    OSQPData *data = (OSQPData *)c_malloc(sizeof(OSQPData));

    // Populate the data object
    data->m = m;
    data->n = n;
    data->P = P;
    data->A = A;
    data->q = q;
    data->l = l;
    data->u = u;

    // Return the data object
    return data;
}

EMSCRIPTEN_KEEPALIVE
void cleanup_data(OSQPData *data)
{
    if (data)
    {
        if (data->A)
            c_free(data->A);
        if (data->P)
            c_free(data->P);
        c_free(data);
    }
}

EMSCRIPTEN_KEEPALIVE
OSQPSettings *create_settings(
    c_float rho,
    c_float sigma,
    c_int max_iter,
    c_float eps_abs,
    c_float eps_rel,
    c_float eps_prim_inf,
    c_float eps_dual_inf,
    c_float alpha,
    enum linsys_solver_type linsys_solver,
    c_float delta,
    c_int polish,
    c_int polish_refine_iter,
    c_int verbose,
    c_int scaled_termination,
    c_int check_termination,
    c_int warm_start,
    c_float time_limit)
{
    OSQPSettings *settings = (OSQPSettings *)c_malloc(sizeof(OSQPSettings));

    // Set the default settings (in case I missed anything)
    osqp_set_default_settings(settings);

    // Now set them one by one
    settings->rho = rho;
    settings->sigma = sigma;
    settings->max_iter = max_iter;
    settings->eps_abs = eps_abs;
    settings->eps_rel = eps_rel;
    settings->eps_prim_inf = eps_prim_inf;
    settings->eps_dual_inf = eps_dual_inf;
    settings->alpha = alpha;
    settings->linsys_solver = linsys_solver;
    settings->delta = delta;
    settings->polish = polish;
    settings->polish_refine_iter = polish_refine_iter;
    settings->verbose = verbose;
    settings->scaled_termination = scaled_termination;
    settings->check_termination = check_termination;
    settings->warm_start = warm_start;
    settings->time_limit = time_limit;

    // Return the settings
    return settings;
}

EMSCRIPTEN_KEEPALIVE
void cleanup_settings(OSQPSettings *settings)
{
    if (settings)
    {
        c_free(settings);
    }
}

EMSCRIPTEN_KEEPALIVE
csc *create_csc_matrix(int m,
                       int n,
                       int nzmax,
                       double *x,
                       int *i,
                       int *p)
{
    // Create the CSC Matrix and pass it to the out pointer
    csc *matrix = (csc *)c_malloc(sizeof(csc));

    if (matrix)
    {
        matrix->m = m;
        matrix->n = n;
        matrix->nzmax = nzmax;
        matrix->x = x;
        matrix->i = i;
        matrix->p = p;
    }

    // Return the CSC matrix
    return matrix;
}