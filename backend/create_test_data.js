const pool = require('./src/config/database');

(async () => {
    try {
        console.log('🚀 Creating Comprehensive Test Data...\n');
        console.log('=' .repeat(80));
        
        // ========================================
        // 1. CREATE 5 PROJECTS
        // ========================================
        console.log('\n📋 Creating 5 Projects...');
        
        const projects = [
            {
                project_code: 'PRJ001',
                project_name: 'Rupayan Housing Complex',
                client_name: 'Rupayan Group',
                location: 'Mirpur, Dhaka',
                start_date: '2024-01-15',
                end_date: '2025-12-31',
                estimated_budget: 50000000,
                status: 'ongoing',
                description: '10-story residential building with modern amenities'
            },
            {
                project_code: 'PRJ002',
                project_name: 'City Center Shopping Mall',
                client_name: 'City Developers Ltd',
                location: 'Gulshan, Dhaka',
                start_date: '2024-03-01',
                end_date: '2026-06-30',
                estimated_budget: 120000000,
                status: 'ongoing',
                description: 'Multi-story commercial shopping complex'
            },
            {
                project_code: 'PRJ003',
                project_name: 'Green Valley Resort',
                client_name: 'Hospitality Bangladesh',
                location: 'Sylhet',
                start_date: '2024-06-01',
                end_date: '2025-09-30',
                estimated_budget: 75000000,
                status: 'planning',
                description: 'Luxury resort with swimming pool and gardens'
            },
            {
                project_code: 'PRJ004',
                project_name: 'Metro Rail Station',
                client_name: 'Dhaka Transport Authority',
                location: 'Farmgate, Dhaka',
                start_date: '2023-08-01',
                end_date: '2024-12-31',
                estimated_budget: 200000000,
                status: 'ongoing',
                description: 'Underground metro rail station construction'
            },
            {
                project_code: 'PRJ005',
                project_name: 'Sunrise Villa Complex',
                client_name: 'Sunrise Properties',
                location: 'Uttara, Dhaka',
                start_date: '2024-09-01',
                end_date: '2025-06-30',
                estimated_budget: 35000000,
                status: 'planning',
                description: 'Premium villa complex with 20 units'
            }
        ];
        
        let projectIds = [];
        for (const proj of projects) {
            const [result] = await pool.query(
                `INSERT INTO projects (
                    project_code, project_name, client_id, location, description,
                    estimated_budget, start_date, end_date, status
                ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
                [
                    proj.project_code,
                    proj.project_name,
                    proj.location,
                    proj.description,
                    proj.estimated_budget,
                    proj.start_date,
                    proj.end_date,
                    proj.status
                ]
            );
            projectIds.push(result.insertId);
            console.log(`  ✓ Created: ${proj.project_name} (${proj.project_code})`);
        }
        
        // ========================================
        // 2. CREATE 50 EMPLOYEES
        // ========================================
        console.log('\n👥 Creating 50 Employees...');
        
        const designations = [
            'Project Manager', 'Site Engineer', 'Supervisor', 'Mason', 
            'Electrician', 'Plumber', 'Painter', 'Helper', 'Labor',
            'Accountant', 'Admin Officer', 'Security Guard'
        ];
        
        const categories = ['Management', 'Technical', 'Skilled Worker', 'Labor', 'Administrative'];
        const departments = ['Construction', 'Electrical', 'Plumbing', 'Painting', 'Management', 'Accounts', 'Security'];
        
        const firstNames = [
            'Rahim', 'Karim', 'Abdul', 'Mohammad', 'Md', 'Sheikh', 'Kamal', 'Jamal', 
            'Rafiq', 'Salam', 'Nasir', 'Bashir', 'Tariq', 'Faruk', 'Shahid', 'Monir',
            'Sohan', 'Roni', 'Imran', 'Rubel', 'Sumon', 'Raju', 'Babul', 'Hasan',
            'Ali', 'Hossain', 'Mia', 'Uddin', 'Khan', 'Chowdhury'
        ];
        
        const lastNames = [
            'Ahmed', 'Hossain', 'Islam', 'Rahman', 'Uddin', 'Khan', 'Mia', 'Alam',
            'Sarkar', 'Das', 'Roy', 'Paul', 'Ghosh', 'Dey', 'Barman'
        ];
        
        for (let i = 0; i < 50; i++) {
            const empId = `EMP${String(i + 1).padStart(3, '0')}`;
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const designation = designations[Math.floor(Math.random() * designations.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const department = departments[Math.floor(Math.random() * departments.length)];
            const dailyWage = (500 + Math.floor(Math.random() * 1500)).toFixed(2);
            const monthlySalary = designation.includes('Manager') || designation.includes('Engineer') ? 
                (30000 + Math.floor(Math.random() * 50000)) : 0;
            
            await pool.query(
                `INSERT INTO employees (
                    employee_id, name, father_name, phone, email, address, 
                    designation, category, department, daily_wage, monthly_salary,
                    joining_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    empId,
                    fullName,
                    `${firstName} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                    `017${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
                    `${firstName.toLowerCase()}.${i}@example.com`,
                    `House ${Math.floor(Math.random() * 100)}, Area ${Math.floor(Math.random() * 50)}, Dhaka`,
                    designation,
                    category,
                    department,
                    dailyWage,
                    monthlySalary,
                    `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
                ]
            );
            
            if ((i + 1) % 10 === 0) {
                console.log(`  ✓ Created ${i + 1}/50 employees...`);
            }
        }
        console.log('  ✅ All 50 employees created!');
        
        // ========================================
        // 3. CREATE VOUCHERS (Mix of Approved & Pending)
        // ========================================
        console.log('\n💰 Creating Vouchers...');
        
        const voucherTypes = ['payment', 'expense', 'receipt'];
        const voucherCategories = ['Food', 'Transport', 'Materials', 'Equipment', 'Medical', 'Utilities'];
        const paymentMethods = ['cash', 'bank', 'mobile_banking'];
        
        // Get employee IDs
        const [employees] = await pool.query('SELECT id FROM employees LIMIT 20');
        
        let voucherCount = 0;
        for (let i = 0; i < 30; i++) {
            const voucherNo = `VCH${String(i + 1).padStart(4, '0')}`;
            const voucherType = voucherTypes[Math.floor(Math.random() * voucherTypes.length)];
            const amount = 1000 + Math.floor(Math.random() * 50000);
            const status = i < 20 ? 'approved' : 'pending'; // 20 approved, 10 pending
            
            await pool.query(
                `INSERT INTO vouchers (
                    voucher_no, voucher_type, date, amount, paid_to, payment_method,
                    project_id, employee_id, category, description, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    voucherNo,
                    voucherType,
                    `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                    amount,
                    `Payment to ${firstNames[Math.floor(Math.random() * firstNames.length)]}`,
                    paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    projectIds[Math.floor(Math.random() * projectIds.length)],
                    employees.length > 0 ? employees[Math.floor(Math.random() * employees.length)].id : null,
                    voucherCategories[Math.floor(Math.random() * voucherCategories.length)],
                    `Voucher payment for ${voucherCategories[Math.floor(Math.random() * voucherCategories.length)]}`,
                    status
                ]
            );
            voucherCount++;
        }
        console.log(`  ✓ Created ${voucherCount} vouchers (20 approved, 10 pending)`);
        
        // ========================================
        // 4. CREATE EXPENSES
        // ========================================
        console.log('\n💵 Creating Expenses...');
        
        const expenseCategories = ['Rickshaw Fare', 'Restaurant', 'Material Cost', 'Labor', 'Equipment', 'Transport'];
        
        for (let i = 0; i < 40; i++) {
            await pool.query(
                `INSERT INTO expenses (
                    expense_date, category, amount, project_id, paid_to, 
                    payment_method, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                    expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
                    500 + Math.floor(Math.random() * 20000),
                    projectIds[Math.floor(Math.random() * projectIds.length)],
                    firstNames[Math.floor(Math.random() * firstNames.length)],
                    ['cash', 'bank', 'mobile_banking'][Math.floor(Math.random() * 3)],
                    `Daily expense payment`
                ]
            );
        }
        console.log('  ✓ Created 40 expenses');
        
        // ========================================
        // 5. CREATE LEDGER ENTRIES
        // ========================================
        console.log('\n📖 Creating Ledger Accounts & Entries...');
        
        // Create some ledger accounts
        const accounts = [
            { code: 'ACC001', name: 'Cash in Hand', type: 'cash', balance: 500000 },
            { code: 'ACC002', name: 'Bank Account', type: 'bank', balance: 2000000 },
            { code: 'ACC003', name: 'Rupayan Project', type: 'project', balance: 0 },
            { code: 'ACC004', name: 'City Mall Project', type: 'project', balance: 0 },
            { code: 'ACC005', name: 'Office Expenses', type: 'expense', balance: 0 }
        ];
        
        let accountIds = [];
        for (const acc of accounts) {
            const [result] = await pool.query(
                `INSERT INTO ledger_accounts (
                    account_code, account_name, account_type, opening_balance, 
                    current_balance, status
                ) VALUES (?, ?, ?, ?, ?, 'active')`,
                [acc.code, acc.name, acc.type, acc.balance, acc.balance]
            );
            accountIds.push(result.insertId);
            console.log(`  ✓ Account: ${acc.name}`);
        }
        
        // Create ledger entries
        for (let i = 0; i < 20; i++) {
            const isDebit = Math.random() > 0.5;
            const amount = 1000 + Math.floor(Math.random() * 30000);
            
            await pool.query(
                `INSERT INTO ledger_entries (
                    account_id, entry_date, description, debit_amount, credit_amount,
                    balance, entry_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    accountIds[Math.floor(Math.random() * accountIds.length)],
                    `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                    isDebit ? 'Payment made' : 'Payment received',
                    isDebit ? amount : 0,
                    isDebit ? 0 : amount,
                    amount,
                    isDebit ? 'debit' : 'credit'
                ]
            );
        }
        console.log('  ✓ Created 20 ledger entries');
        
        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST DATA SUMMARY:');
        console.log('='.repeat(80));
        console.log('  ✅ Projects:     5 created');
        console.log('  ✅ Employees:    50 created');
        console.log('  ✅ Vouchers:     30 created (20 approved, 10 pending)');
        console.log('  ✅ Expenses:     40 created');
        console.log('  ✅ Accounts:     5 created');
        console.log('  ✅ Ledger:       20 entries created');
        console.log('\n🎉 All test data created successfully!');
        console.log('='.repeat(80));
        console.log('\nNow you can test the app at: http://localhost:3000');
        console.log('Login with: admin@khazabilkis.com');
        console.log('\n✅ Dashboard will show:');
        console.log('   - 5 Active Projects');
        console.log('   - Charts with expense data');
        console.log('   - 10 Pending Vouchers to approve');
        console.log('   - Financial statistics');
        console.log('\n✅ All pages will have data to display!');
        console.log('='.repeat(80) + '\n');
        
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
