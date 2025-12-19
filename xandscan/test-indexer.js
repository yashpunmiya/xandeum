// Test script to manually trigger the indexer and see output
import { updateNodes } from './src/lib/indexer';

console.log('Starting node discovery...');

updateNodes()
  .then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
