#!/bin/bash
# This script ensures express is installed in both the project root and build directory

echo "Installing express in project root..."
npm install express

if [ -d "build" ]; then
  echo "Installing express in build directory..."
  cd build
  npm install express
  cd ..
fi

echo "Express installation complete!"
