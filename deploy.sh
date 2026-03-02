#!/bin/bash

# Navigate to project directory and pull latest code
cd ~/SportsPrediction
git pull origin main

# Deploy frontend
cd ~/SportsPrediction/frontend
npm install
npm run build
pm2 restart sportsbet
