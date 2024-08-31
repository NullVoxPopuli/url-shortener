#!/bin/bash

function hasHostsEntry() {
  grep -n $1 /etc/hosts
}

function ensureHostsEntry() {
  local has_entry=$(hasHostsEntry $1)

  if [ -z "$has_entry" ]; then
    local fullEntry="127.0.0.1 $1"
    echo "Adding '$fullEntry' to /etc/hosts"

    echo "$fullEntry" | sudo tee -a /etc/hosts
  fi
}

ensureHostsEntry "nvp.local"
ensureHostsEntry "docs.nvp.local"
ensureHostsEntry "api.nvp.local"
ensureHostsEntry "app.nvp.local"
