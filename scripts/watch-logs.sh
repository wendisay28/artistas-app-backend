#!/bin/bash
# Mostrar los últimos logs del proceso tsx
ps aux | grep "tsx.*src/index.ts" | grep -v grep | head -1
