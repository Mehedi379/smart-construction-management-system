const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/DailySheets.jsx');

console.log('🔧 Fixing DailySheets.jsx modal nesting...\n');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find the viewSheet modal start
const modalStartMarker = '{/* View Sheet Modal with Signature Workflow */}';
const modalStartIndex = content.indexOf(modalStartMarker);

if (modalStartIndex === -1) {
    console.log('❌ Could not find viewSheet modal');
    process.exit(1);
}

console.log('✅ Found viewSheet modal at line ~' + content.substring(0, modalStartIndex).split('\n').length);

// Find the end of the modal (look for the closing pattern)
// The modal ends with: )} followed by </div> and then </div> again (form modal closing)
let searchIndex = modalStartIndex;
let braceCount = 0;
let modalEndIndex = -1;
let foundClosing = false;

// Find the matching closing for {viewSheet &&
for (let i = modalStartIndex; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
    } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0 && content.substring(i-1, i+1) === '})') {
            modalEndIndex = i + 1;
            foundClosing = true;
            break;
        }
    }
}

if (!foundClosing) {
    console.log('❌ Could not find modal end');
    process.exit(1);
}

console.log('✅ Found modal end at line ~' + content.substring(0, modalEndIndex).split('\n').length);

// Extract the modal
const modalContent = content.substring(modalStartIndex, modalEndIndex);

// Find the line with </div> after the modal (form modal closing)
const afterModal = content.substring(modalEndIndex);
const firstDivClose = afterModal.indexOf('</div>');
const secondDivClose = afterModal.indexOf('</div>', firstDivClose + 6);
const thirdDivClose = afterModal.indexOf('</div>', secondDivClose + 6);

// Remove modal from current position + the extra </div>
const modalWithExtraDiv = content.substring(modalStartIndex, modalEndIndex + thirdDivClose + 6);
const contentWithoutModal = content.substring(0, modalStartIndex) + content.substring(modalEndIndex + thirdDivClose + 6);

// Find where to insert (before Sheets List)
const sheetsListIndex = contentWithoutModal.indexOf('{/* Sheets List */}');

if (sheetsListIndex === -1) {
    console.log('❌ Could not find Sheets List');
    process.exit(1);
}

console.log('✅ Found Sheets List at line ~' + contentWithoutModal.substring(0, sheetsListIndex).split('\n').length);

// Insert the modal before Sheets List
const fixedContent = contentWithoutModal.substring(0, sheetsListIndex) + 
                     modalContent + '\n\n            ' + 
                     contentWithoutModal.substring(sheetsListIndex);

// Backup the original
const backupPath = filePath + '.backup';
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created: DailySheets.jsx.backup\n');

// Save the fixed file
fs.writeFileSync(filePath, fixedContent);

console.log('✅ Modal moved successfully!');
console.log('✅ File saved: ' + filePath);
console.log('\n🎉 Fix complete! Refresh your browser and test the View button.');
console.log('\n📝 Note: Backup saved as DailySheets.jsx.backup');
