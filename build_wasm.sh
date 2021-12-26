# Compile the emscripten
(
  emcc \
    -O3 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "getValue", "setValue"]' \
    -s EXPORTED_FUNCTIONS='["_malloc", "_osqp_setup", "_osqp_update_lin_cost", "_osqp_update_bounds", "_osqp_update_P", "_osqp_update_A", "_osqp_cleanup"]' \
    -s STRICT=1 \
    -s WASM=1 \
    -s SINGLE_FILE=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="OSQP_C_Module" \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s ENVIRONMENT='web' \
    osqp/build/out/libosqp.a src/osqp.c \
    -o src/osqp.wasm.js
)