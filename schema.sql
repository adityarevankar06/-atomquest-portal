-- AtomQuest Portal Database Schema
-- PostgreSQL 15+

-- Create database
CREATE DATABASE IF NOT EXISTS atomquest;

-- Create tables
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Employee', 'Manager', 'Admin')) DEFAULT 'Employee',
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thrust_area VARCHAR(255),
    uom_type VARCHAR(50) CHECK (uom_type IN ('Numeric', 'Percentage', 'Timeline', 'Zero')),
    uom_direction VARCHAR(10) DEFAULT 'Min' CHECK (uom_direction IN ('Min', 'Max')),
    target DECIMAL(15, 2) NOT NULL,
    weightage DECIMAL(5, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Locked', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    CONSTRAINT weightage_range CHECK (weightage >= 10 AND weightage <= 100)
);

CREATE TABLE IF NOT EXISTS quarterly_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    quarter VARCHAR(10) CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    fiscal_year INT NOT NULL,
    actual_achievement DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'On Track', 'Completed')),
    progress_score DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(goal_id, quarter, fiscal_year)
);

CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_id UUID NOT NULL REFERENCES quarterly_achievements(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    field_changed VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_goals_employee_id ON goals(employee_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_approved_by ON goals(approved_by);
CREATE INDEX idx_achievements_goal_id ON quarterly_achievements(goal_id);
CREATE INDEX idx_achievements_quarter ON quarterly_achievements(quarter, fiscal_year);
CREATE INDEX idx_checkins_achievement_id ON check_ins(achievement_id);
CREATE INDEX idx_checkins_manager_id ON check_ins(manager_id);
CREATE INDEX idx_audit_goal_id ON audit_logs(goal_id);
CREATE INDEX idx_audit_changed_at ON audit_logs(changed_at DESC);

-- Insert test data
INSERT INTO employees (name, email, role) VALUES 
    ('Alice Johnson', 'alice@acme.com', 'Employee'),
    ('Bob Manager', 'bob@acme.com', 'Manager'),
    ('Charlie Admin', 'charlie@acme.com', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample goals for demo
INSERT INTO goals (employee_id, title, description, thrust_area, uom_type, uom_direction, target, weightage, status)
SELECT 
    (SELECT id FROM employees WHERE email = 'alice@acme.com'),
    'Increase Revenue',
    'Increase annual revenue',
    'Revenue Growth',
    'Numeric',
    'Min',
    100000,
    25,
    'Draft'
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = 'Increase Revenue' AND employee_id = (SELECT id FROM employees WHERE email = 'alice@acme.com'));

INSERT INTO goals (employee_id, title, description, thrust_area, uom_type, uom_direction, target, weightage, status)
SELECT 
    (SELECT id FROM employees WHERE email = 'alice@acme.com'),
    'Customer Satisfaction',
    'Achieve customer satisfaction score',
    'Customer Retention',
    'Percentage',
    'Min',
    85,
    25,
    'Draft'
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = 'Customer Satisfaction' AND employee_id = (SELECT id FROM employees WHERE email = 'alice@acme.com'));

INSERT INTO goals (employee_id, title, description, thrust_area, uom_type, uom_direction, target, weightage, status)
SELECT 
    (SELECT id FROM employees WHERE email = 'alice@acme.com'),
    'Process Efficiency',
    'Improve process efficiency',
    'Operational Excellence',
    'Timeline',
    'Min',
    2026.12,
    25,
    'Draft'
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = 'Process Efficiency' AND employee_id = (SELECT id FROM employees WHERE email = 'alice@acme.com'));

INSERT INTO goals (employee_id, title, description, thrust_area, uom_type, uom_direction, target, weightage, status)
SELECT 
    (SELECT id FROM employees WHERE email = 'alice@acme.com'),
    'Safety Incidents',
    'Reduce safety incidents to zero',
    'Team Development',
    'Zero',
    'Min',
    0,
    25,
    'Draft'
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = 'Safety Incidents' AND employee_id = (SELECT id FROM employees WHERE email = 'alice@acme.com'));
