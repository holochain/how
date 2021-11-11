#!/usr/bin/env bash
set -euo pipefail
# set -x

export CARGO_HOME=$(pwd)/.cargo

main () {
  run_targets $*
}

run_targets () {
  for func in $*; do
    run $func
  done
}

run () {
  func=$1
  if [[ $(type -t $func) == function ]]; then
    # echo "----> ${func}"
    # echo "      CARGO_TARGET_DIR: ${CARGO_TARGET_DIR}"
    # echo "      RUSTFLAGS: ${RUSTFLAGS}"
    $func
  else
    echo "Unknown command: ${func}"
    exit 1
  fi
}

shell () {
  command=$1
  echo "----> ${command}"
  eval "$command"
}

in_test_env () {
  # RUST_BACKTRACE=1
  # RUSTFLAGS="-D warnings -A dead_code -A unused-imports"
  # RUSTFLAGS="-D warnings -A unused-variables"
  # CARGO_TARGET_DIR=target/test
  shell "CARGO_TARGET_DIR=target"
  run_targets $*
}

# targets to be passed in as command line args:

checks () {
  time bin/run.sh test clippy
}

test () {
  in_test_env build_dna test_metal
}

test_watch () {
  # ensure_cargo_watch_installed
  shell "cargo watch --clear -- bin/run.sh test"
}

test_metal () {
  shell "cargo test -- --nocapture"
}

build_happ () {
  run build_dna
  shell "hc app pack dna/workdir/happ"
}

build_dna () {
  run build_zome
  shell "hc dna pack dna/workdir/dna"
}

build_zome () {
  # CARGO_TARGET_DIR=target/zome
  # cargo build --target wasm32-unknown-unknown
  shell "cargo build --release --target wasm32-unknown-unknown"
}

clippy () {
  # CARGO_TARGET_DIR=target/clippy
  shell "cargo clippy --all-targets --all-features -- -D warnings"
}

clippy_watch () {
  # ensure_cargo_watch_installed
  shell "cargo watch --clear -- bin/run.sh clippy"
}

clean () {
  shell "git clean -Xfd"
  shell "cargo clean"
}

shipit () {
  if [[ -z $(git status --porcelain) ]]; then
    run checks
    shell "git push origin HEAD"
  else
    echo "Error: git status not clean:"
    set -x
    git status
    exit 1
  fi
}

main $*