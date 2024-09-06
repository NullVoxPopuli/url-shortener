#!/bin/bash

command="PWDEBUG=\"console\" \
  NODE_ENV=\"test\" \
  NODE_OPTIONS=\"--no-deprecation $NODE_OPTIONS\" \
    pnpm node --loader ts-node/esm \
      ./bin/test.ts \
      --devtools \
      --headed \
      --browser=firefox \
      --tests \"$1\""

echo "Running:"
echo ""
echo -e "\t$command"
echo ""

eval $command
