const pool = require('../config/database');

exports.createVoucher = async (voucherData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const voucherNo = await generateVoucherNumber(voucherData.voucher_type);
        
        const [result] = await conn.query(
            `INSERT INTO vouchers (
                voucher_no, voucher_type, date, amount, paid_to, paid_by,
                payment_method, project_id, employee_id, client_id, supplier_id,
                category, description, reference_no, attachment, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                voucherNo,
                voucherData.voucher_type,
                voucherData.date,
                voucherData.amount,
                voucherData.paid_to || null,
                voucherData.paid_by || null,
                voucherData.payment_method || 'cash',
                voucherData.project_id || null,
                voucherData.employee_id || null,
                voucherData.client_id || null,
                voucherData.supplier_id || null,
                voucherData.category || null,
                voucherData.description || null,
                voucherData.reference_no || null,
                voucherData.attachment || null,
                voucherData.status || 'pending',
                voucherData.created_by
            ]
        );

        // Create ledger entry
        if (voucherData.account_id) {
            const entryType = voucherData.voucher_type === 'payment' ? 'debit' : 'credit';
            const debitAmount = entryType === 'debit' ? voucherData.amount : 0;
            const creditAmount = entryType === 'credit' ? voucherData.amount : 0;

            await conn.query(
                `INSERT INTO ledger_entries (
                    account_id, entry_date, voucher_id, description,
                    debit_amount, credit_amount, balance, entry_type,
                    reference_no, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    voucherData.account_id,
                    voucherData.date,
                    result.insertId,
                    voucherData.description || 'Voucher entry',
                    debitAmount,
                    creditAmount,
                    entryType,
                    voucherNo,
                    voucherData.created_by
                ]
            );

            // Update account balance
            await conn.query(
                `UPDATE ledger_accounts 
                 SET current_balance = current_balance + ? 
                 WHERE id = ?`,
                [voucherData.voucher_type === 'payment' ? voucherData.amount : -voucherData.amount, voucherData.account_id]
            );
        }

        await conn.commit();
        return result.insertId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getVouchers = async (filters = {}, user = null, projectFilter = null) => {
    let query = 'SELECT v.*, p.project_name, e.name as employee_name, c.name as client_name, s.name as supplier_name FROM vouchers v ';
    query += 'LEFT JOIN projects p ON v.project_id = p.id ';
    query += 'LEFT JOIN employees e ON v.employee_id = e.id ';
    query += 'LEFT JOIN clients c ON v.client_id = c.id ';
    query += 'LEFT JOIN suppliers s ON v.supplier_id = s.id ';
    
    const conditions = [];
    const values = [];

    // PROJECT-BASED FILTERING (from middleware)
    // Non-admin users can only see vouchers from their assigned project
    if (projectFilter && !projectFilter.isAdmin && projectFilter.projectId) {
        conditions.push('v.project_id = ?');
        values.push(projectFilter.projectId);
    } else if (user && user.role !== 'admin' && !projectFilter) {
        // Fallback to old method if projectFilter not provided
        query += ` INNER JOIN employees emp ON emp.user_id = ? AND v.project_id = emp.assigned_project_id `;
        values.push(user.id);
    }

    if (filters.voucher_type) {
        conditions.push('v.voucher_type = ?');
        values.push(filters.voucher_type);
    }

    if (filters.status) {
        conditions.push('v.status = ?');
        values.push(filters.status);
    }

    if (filters.from_date) {
        conditions.push('v.date >= ?');
        values.push(filters.from_date);
    }

    if (filters.to_date) {
        conditions.push('v.date <= ?');
        values.push(filters.to_date);
    }

    if (filters.project_id) {
        conditions.push('v.project_id = ?');
        values.push(filters.project_id);
    }

    if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
    } else if (user && user.role !== 'admin') {
        // If no other conditions but user is non-admin, add WHERE
        // (already added INNER JOIN above)
    } else {
        query += ' WHERE 1=1';
    }

    query += ' ORDER BY v.date DESC, v.id DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
        if (filters.offset) {
            query += ' OFFSET ?';
            values.push(parseInt(filters.offset));
        }
    }

    const [vouchers] = await pool.query(query, values);
    return vouchers;
};

exports.getVoucherById = async (id) => {
    const [vouchers] = await pool.query(
        `SELECT v.*, p.project_name, e.name as employee_name, 
         c.name as client_name, s.name as supplier_name,
         u.name as created_by_name
         FROM vouchers v
         LEFT JOIN projects p ON v.project_id = p.id
         LEFT JOIN employees e ON v.employee_id = e.id
         LEFT JOIN clients c ON v.client_id = c.id
         LEFT JOIN suppliers s ON v.supplier_id = s.id
         LEFT JOIN users u ON v.created_by = u.id
         WHERE v.id = ?`,
        [id]
    );
    return vouchers[0] || null;
};

exports.updateVoucher = async (id, voucherData) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Get old voucher data to check if status is changing
        const [oldVoucher] = await conn.query(
            'SELECT status, id, project_id, amount, created_by FROM vouchers WHERE id = ?',
            [id]
        );

        if (oldVoucher.length === 0) {
            throw new Error('Voucher not found');
        }

        // Build dynamic update query (only update provided fields)
        const updates = [];
        const values = [];

        if (voucherData.voucher_type !== undefined) {
            updates.push('voucher_type = ?');
            values.push(voucherData.voucher_type);
        }
        if (voucherData.date !== undefined) {
            updates.push('date = ?');
            values.push(voucherData.date);
        }
        if (voucherData.amount !== undefined) {
            updates.push('amount = ?');
            values.push(voucherData.amount);
        }
        if (voucherData.paid_to !== undefined) {
            updates.push('paid_to = ?');
            values.push(voucherData.paid_to);
        }
        if (voucherData.status !== undefined) {
            updates.push('status = ?');
            values.push(voucherData.status);
        }
        if (voucherData.project_id !== undefined) {
            updates.push('project_id = ?');
            values.push(voucherData.project_id);
        }
        if (voucherData.employee_id !== undefined) {
            updates.push('employee_id = ?');
            values.push(voucherData.employee_id);
        }
        if (voucherData.description !== undefined) {
            updates.push('description = ?');
            values.push(voucherData.description);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const updateQuery = `UPDATE vouchers SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await conn.query(updateQuery, values);

        // If voucher status changed to 'approved', trigger auto sheet creation
        if (voucherData.status === 'approved' && (!oldVoucher[0].status || oldVoucher[0].status !== 'approved')) {
            
            console.log('\n✅ Voucher approved, triggering auto sheet creation...');
            console.log('   Voucher ID:', id);
            console.log('   Project ID:', oldVoucher[0].project_id);
            console.log('   Amount:', voucherData.amount || oldVoucher[0].amount);
            console.log('   Created By:', oldVoucher[0].created_by);
            
            try {
                // Check if stored procedure exists
                const [procCheck] = await conn.query(
                    `SELECT COUNT(*) as count FROM information_schema.ROUTINES 
                     WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'create_or_add_to_sheet'`,
                    [process.env.DB_NAME || 'construction_db']
                );
                
                if (procCheck[0].count > 0) {
                    // Call the stored procedure to create or add to sheet
                    const amount = voucherData.amount || oldVoucher[0].amount;
                    const projectId = oldVoucher[0].project_id;
                    const createdBy = oldVoucher[0].created_by;
                    
                    console.log('   Calling stored procedure with:', { id, projectId, amount, createdBy });
                    
                    await conn.query(
                        'CALL create_or_add_to_sheet(?, ?, ?, ?)',
                        [id, projectId, amount, createdBy]
                    );
                    
                    console.log('✅ Auto sheet creation triggered successfully\n');
                    
                    // Get the newly created sheet and start workflow
                    const [sheets] = await conn.query(
                        'SELECT id FROM daily_sheets WHERE created_at > NOW() - INTERVAL 10 SECOND ORDER BY id DESC LIMIT 1'
                    );
                    
                    if (sheets.length > 0) {
                        const sheetId = sheets[0].id;
                        console.log('   Starting workflow for sheet:', sheetId);
                        await startSheetWorkflow(conn, sheetId, projectId);
                    }
                } else {
                    console.warn('⚠️ Stored procedure create_or_add_to_sheet does not exist. Skipping auto sheet creation.\n');
                }
            } catch (spError) {
                console.error('\n⚠️ Stored procedure error (continuing anyway):', spError.message);
                console.error('   Error code:', spError.code);
                console.error('   Error SQL State:', spError.sqlState);
                console.error('   This is NON-CRITICAL - voucher will still be approved\n');
                // Don't fail the approval if stored procedure fails
            }
        }

        await conn.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.deleteVoucher = async (id) => {
    const [result] = await pool.query('DELETE FROM vouchers WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

async function generateVoucherNumber(type) {
    const prefix = type === 'payment' ? 'PV' : type === 'expense' ? 'EV' : type === 'receipt' ? 'RV' : 'JV';
    const year = new Date().getFullYear();
    
    const [result] = await pool.query(
        `SELECT COUNT(*) as count FROM vouchers WHERE voucher_no LIKE ?`,
        [`${prefix}-${year}%`]
    );
    
    const count = result[0].count + 1;
    const number = String(count).padStart(4, '0');
    return `${prefix}-${year}-${number}`;
}

/**
 * Start workflow for a daily sheet
 */
async function startSheetWorkflow(conn, sheetId, projectId) {
    try {
        // Get sheet workflow template (entity_type = 'sheet')
        const [workflows] = await conn.query(
            'SELECT id FROM workflow_templates WHERE entity_type = "sheet" AND is_active = TRUE LIMIT 1'
        );
        
        if (workflows.length === 0) {
            console.error('No sheet workflow template found');
            return;
        }
        
        const workflowTemplateId = workflows[0].id;
        
        // Check if workflow already exists
        const [existingWorkflow] = await conn.query(
            'SELECT id FROM sheet_workflows WHERE sheet_id = ?',
            [sheetId]
        );
        
        if (existingWorkflow.length > 0) {
            console.log(`Workflow already exists for sheet ${sheetId}`);
            return;
        }
        
        // Create sheet_workflow record
        await conn.query(
            'INSERT INTO sheet_workflows (sheet_id, workflow_id, current_step, status) VALUES (?, ?, 1, "pending")',
            [sheetId, workflowTemplateId]
        );
        
        // Update sheet status to pending
        await conn.query(
            'UPDATE daily_sheets SET status = "pending" WHERE id = ?',
            [sheetId]
        );
        
        console.log(`✅ Workflow started for sheet ${sheetId}`);
        
        // Notify first role
        const [firstStep] = await conn.query(
            `SELECT ws.role_id, r.role_name, r.role_code
             FROM workflow_steps ws
             INNER JOIN roles r ON ws.role_id = r.id
             WHERE ws.workflow_id = ? AND ws.step_number = 1
             ORDER BY ws.step_number`,
            [workflowTemplateId]
        );
        
        if (firstStep.length > 0) {
            // Find users with this role AND same project
            const [users] = await conn.query(
                `SELECT u.id, u.email, u.name, u.role 
                 FROM users u 
                 INNER JOIN employees e ON u.id = e.user_id
                 WHERE u.role = ? 
                 AND u.is_active = TRUE
                 AND e.assigned_project_id = ?`,
                [firstStep[0].role_code, projectId]
            );
            
            // Send notifications
            for (const userData of users) {
                await conn.query(
                    `INSERT INTO notifications (user_id, notification_type, entity_type, entity_id, title, message)
                     VALUES (?, 'signature_request', 'sheet', ?, 'Sheet Signature Required', ?)`,
                    [userData.id, sheetId, `Daily sheet requires your signature as ${firstStep[0].role_name}`]
                );
            }
            
            console.log(`📧 Notifications sent to ${users.length} user(s)`);
        }
    } catch (error) {
        console.error('❌ Error starting sheet workflow:', error.message);
        // Don't throw - workflow start failure shouldn't break voucher approval
    }
}
