#!/bin/bash

cd ~SportsPrediction/frontend
git pull origin main
npm install
npm run build
pm2 restart sportsbet